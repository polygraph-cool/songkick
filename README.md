So here are the main facts for the piece. Please excuse the dry presentation. Note: For "popularity", I used SongKick's 0-1 measure of popularity which is highly correlated with venue size, so I assume highly correlated with actual sales for the show:

- I scraped data from like 450 venues in the New York Area from 2013 to 2016, about 170 of which have had over 50 shows

- In 2013, 16,690 acts played SF. 57% headlined a show and thus the other 43% topped out at second or third billing. So what happened to those acts?

- 16,690 acts of those 9,127 acts returned (54% of the total). 52% of the headliners returned, compared to 47% of the openers.

- Of the headliners who returned, 48% played a more popular show.

- Only 2,180 acts the 7,133 openers returned as a headliners of show (30.6%). But only 297 come back to headline a show that the popularity score indicates would be at a venue with over 600 people (13.6%). Only 73 (3.3%) played a show that would be a 1,500 person venue.

- Those opener numbers actually seemed kind of high to me, but they are inflated by acts that opened big shows. If we only look at the bands who opened small show, the water fall is starker. 5,887 bands opened shows where the capacity was probably less than 600 in 2013. Of those, 2,638 returned (45%), 1,683 returned to headline a show (29%), but only 50 come back to play a 600+ venue show (<1%) and 4 played a 1500+ venue show. Those 4 were…. Zach Myers, Oteil Burbridge, Jay Haze and Felix Cabrera.


# starter

A starter template for projects.

* Write in ES6 (preset with d3)
* Stylus for CSS pre-processor
* Bundles, minifies JS with Webpack
* Bundles, minifies, auto-prefixes CSS
* Inlines CSS
* Async font loading (using FOUT)

## Dependencies
[node](http://nodejs.org)

## Setup
Create a new project directory then:

```
curl -Lk http://bit.ly/2bgptna > Makefile; make;
```

## Usage

#### Development
`gulp`

Any changes to the **src** folder will trigger live reload.

Put JS in **src/js/entry.js** and CSS in **src/css/story/story.styl**.

#### Deploy

Run `gulp prod`

Generates a single html file and assets in the **dist/prod** folder.