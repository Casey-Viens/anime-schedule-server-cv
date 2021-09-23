require('dotenv').config();
const fetch = require('node-fetch');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const AnimeLink = require('./animeLinkModel');
const express = require('express');
const { Sequelize, Op, Model, DataTypes } = require("sequelize");
const app = express();

// create two user ids stored in cookies
// active and searched
// if searched is null then use active
// searched can be id or name ...will need logic for that
// https://anilist.github.io/ApiV2-GraphQL-Docs/
// set searched with button on client
// if the user clicks home button it deletes searched and returns to active id

// adjust current anime get to account for getting searched user anime



// look into ways of merging/sync data between anilist and mal
// map both anilist and mal anime
// loop through anilist and compare against mal
// make mal changes where info does not match

// when/where should i run this?

// maybe sync ani->mal...then compare anime length...then sync mal->ani where ani is null



async function request(url = '', method, data, headers) {
    const response = await fetch(url, {
        method: method,
        mode: 'cors',
        headers: headers,
        body: data,
    });
    return response.json();
}

async function sync() {
    await AnimeLink.sync({ alter: true });
    console.log("Model was synchronized successfully.");
}

async function upsertAnimeLink(userID, animeID, link) {
    const anime = await AnimeLink.upsert({ UserID: userID, AnimeID: animeID, link: link });
    console.log(anime);
}

async function getAnimeLink(id, link) {

}

async function getAnimeLinks(id) {
    const animes = await AnimeLink.findAll({
        where: {
            UserID: id
        }
    });

    let animeMap = new Map();

    animes.forEach(anime => {
        animeMap.set(anime.AnimeID, { animeLink: anime.link })
    });

    return animeMap;
}
// syncing the model of the database with the datebase itself
sync();
console.log("Model successfully built and synced.")


app.use(cors({ origin: process.env.CLIENT_HOST, credentials: true }))
app.use(express.json())
app.use(cookieParser())

app.get('/', function (req, res) {
    res.send('Hello World')
    // 
})

app.get('/login', function (req, res) {
    const body = {
        "grant_type": 'authorization_code',
        "client_id": process.env.CLIENT_ID,
        "client_secret": process.env.CLIENT_SECRET,
        "redirect_uri": process.env.REDIRECT_URI,
        "code": req.query.code,
    }
    const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    }
    request('https://anilist.co/api/v2/oauth/token', 'POST', JSON.stringify(body), headers)
        .then(token => {
            res.cookie('token', token);
            console.log("obtained token");
            const headers = {
                'Authorization': 'Bearer ' + token.access_token,
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            };
            let query =
                `query{
                    Viewer{
                        id
                }
            }`;

            const body = JSON.stringify({
                query: query
            });
            request('https://graphql.anilist.co', 'POST', body, headers)
                .then(user => {
                    res.cookie('userID', user);
                    console.log("Obtained UserID\n", user)
                    res.redirect(process.env.CLIENT_HOST);
                })
        })
})


app.get('/animeSchedule', function (req, res) {
    console.log("animeSchedule request");
    let query =
        `query ($userID: Int) {
            current: MediaListCollection(userId: $userID, status_in: [CURRENT], type: ANIME) {
              ...listFields
            }
            completed: MediaListCollection(userId: $userID, status_in: [COMPLETED], type: ANIME) {
              ...listFields
            }
          }
          
          fragment listFields on MediaListCollection {
            lists {
              entries {
                id
                mediaId
                status
                progress
                score(format: POINT_100)
                media {
                  title {
                    romaji
                    english
                  }
                  episodes
                  coverImage {
                    extraLarge
                    color
                  }
                  nextAiringEpisode {
                    airingAt
                    timeUntilAiring
                    episode
                  }
                }
              }
            }
          }`;

    let variables = {
        userID: req.cookies.userID.data.Viewer.id,
        status_in: ["CURRENT", "COMPLETED"]
    };

    const body = JSON.stringify({
        query: query,
        variables: variables
    });

    console.log(req.cookies);
    const headers = {
        'Authorization': 'Bearer ' + req.cookies.token.access_token,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    }
    request('https://graphql.anilist.co', 'POST', body, headers)
        .then(anilist => {
            console.log(anilist)
            // clean anime
            anilistAnime = anilist.data;
            // anilistAnime.current.lists[0].entries
            // anilistAnime.completed.lists[0].entries
            // select all anime in database
            if (anilistAnime.length === 0) {
                res.json("Account has no anime")
            } else if (anilistAnime.current.lists[0].entries[0].status != "CURRENT") {
                res.json("Account has no currently watching anime")
            } else {
                getAnimeLinks(req.cookies.userID.data.Viewer.id).then((databaseAnime) => {
                    // loop through anilist anime
                    for (alAnime in anilistAnime.current.lists[0].entries) {
                        if (databaseAnime.has(anilistAnime.current.lists[0].entries[alAnime].mediaId)) {
                            anilistAnime.current.lists[0].entries[alAnime].link = databaseAnime.get(anilistAnime.current.lists[0].entries[alAnime].mediaId).animeLink
                        } else {
                            anilistAnime.current.lists[0].entries[alAnime].link = "#";
                        }
                    }
                    res.json(anilistAnime);
                })
            }
        })
})
// consider merging routes and doing logic within routes depending on body before making requests
app.post('/setAnimeLink', function (req, res) {
    console.log("set Anime Link Request");
    console.log(req.body);
    upsertAnimeLink(req.cookies.userID.data.Viewer.id, req.body.id, req.body.link).then(res.send("Anime Link Updated"));
})

app.post('/updateAnime', function (req, res) {
    console.log("Updating Anime...");
    console.log(req.body);

    let query =
        `mutation($id: Int, $progress: Int, $status: MediaListStatus, $score: Float){
        SaveMediaListEntry (id: $id, progress: $progress, status: $status, score: $score){
            id
            progress
            status
            score
        }
    }`;

    let variables = {
        id: req.body.id,
        progress: req.body.progress,
        status: req.body.status,
        score: req.body.score
    };

    const body = JSON.stringify({
        query: query,
        variables: variables
    });

    const headers = {
        'Authorization': 'Bearer ' + req.cookies.token.access_token,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    }
    request('https://graphql.anilist.co', 'POST', body, headers)
        .then(anilist => res.json(anilist));
})


app.listen(3000)
