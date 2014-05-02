BoxOfficeSuccess
================
Chris Leuer, CSC-171

Final Project

April 2014

Box Office Success Visualization

## Overview

The box office visualization animates movie box office results from 2012.  The source code for this visualization
can be publicly accessed on [github](https://github.com/cleuer/BoxOfficeSuccess).

### Code is structure on github

+ index.html - html main page
+ boxoffice.js - all javascript to create visualization
+ libs director - shared libraries Jquery,FileSave.js, and d3.js
+ scraping directory - boxofficemojo.html and rottentomatoes.html to scrape their respective websites for data
+ data directory- boxoffice2012combined.csv and moviemaster.csv are csv files used for visualization
+ css directory - boxoffice.css used for styling

## Instructions for use

The box office visualization is available as single d3.js driven page.

### Access directly from browser

1. Access directly [Box Office Success](http://cleuer.github.io/BoxOfficeSuccess) on git hub pages.

### Run from local machine

1. Clone the project from GitHub [BoxOfficeSuccess](https://github.com/cleuer/BoxOfficeSuccess).
git clone https://github.com/cleuer/BoxOfficeSuccess

2. Start a web server from root directory of project.
python -m http.server

3. Open browser and navigate to: http://localhost:8000/

## Sources

### Data

Data from external websites and APIs was collected and used to display the visualization.

1. Box Office Mojo. Data from [BoxOfficeMojo](http://www.boxofficemojo.com) was used to display budget, gross, titles and theatre count.

2. Facebook.  Data from [Facebook] (http://www.facebook.com) was used to display number of Facebook likes.

3. Rotten Tomatoes. Data from [RottenTomatoes API](http://developer.rottentomatoes.com) was used to display audience and critic scores.

4. IMDB. Data for movie category was entered from [IMDb](http://www.imdb.com).

### Code

1. Stackoverflow. A function by [Phillip Lenssen](http://stackoverflow.com/questions/10599933/convert-long-number-into-abbreviated-string-in-javascript-with-a-special-shortn)
named abbreviateNumber was used to abbreviate larger numbers.

2. Rotten Tomatoes.  A javascript [example script](http://developer.rottentomatoes.com/docs/read/json/v10/examples#JavaScript) was
used as starting point to create rottentomatoes.html

3. Caged.  A tooltip library [d3-tip](http://labratrevenge.com/d3-tip) was used to display tooltips.

4. Jquery. The [Jquery](http://jquery.com) library was used implement javascript code.

5. d3.js.  The [d3.js library](http://d3js.org) was used to render the visualization.

6. Twitter Bootstrap. The [Bootstrap](http://getbootstrap.com) library was used to style the visualization.

7. Eli Grey.  A function from Javascript library [Filesaver.js](https://github.com/cleuer/BoxOfficeSuccess/blob/master/libs/FileSaver.js) was
used to save array data to csv files.

8. Mike Bostock.  Examples of d3.js [bar chart](http://bl.ocks.org/mbostock/3885705) and [Wealth & Health of Nations](http://bost.ocks.org/mike/nations)
were used at starting points.


