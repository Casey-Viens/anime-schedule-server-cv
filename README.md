# Anime Calendar

## **Problems**

The two popular sources (MyAnimeList, AniList) for storing and rating anime do not provide an easy way to view a weekly anime schedule.

Storing each anime's preferred link became a mess of bookmarks.

It was a hassle to quickly see which shows had an episode I had not yet watched compared to those which I was caught up on.

## **Solutions**

To create and host a site that used AniList's API to gather the shows I am currently watching and display them in a weekly format.

Store each anime's preferred site to be watching in a database to be used on the site.

The addition of a notification tag on each anime showing how many episodes I have not yet watched.

## **Technologies**

- Node.js
- Svelte
- Postgres
- HTML
- CSS
- AWS
    - S3
    - EC2
    - RDS
- TailwindCSS
- AniList API

## **Features**

- Secure access to your AniList's account data via OAuth
- Dynamic display of shows which you are currently watching
- Convenient access to your shows, just one click away
- Easy access to updating the number of episodes seen
- Simple storage of preferred anime viewing link
- Helpful display of shows matching the current rating when rating a show
- Quick location of new episodes via notification in the corner of each show

## **Pictures of Site**

### **Site**
![Anime Calendar Page](/readMePictures/animeCalendar.png)
### **Anime On Hover**
![Anime Calendar On Hover](/readMePictures/animeCalendarOnHover.png)
### **Anime Edit Form**
![Anime Calendar Edit Form](/readMePictures/animeCalendarEditClick.png)
