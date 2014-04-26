/**
 * Chris Leuer
 * Box Office Success
 * April 2014
 */
var bbVis, brush, createVis, dataSet, handle, height, margin, svg, svg2, width,
    circleSize, maxWeeklyGross, maxMoviesPerWeek, vis, xScale, yScale, yAxis, xAxis, rScale, animateDuration,
    firstWeekIndex, totalGrossFilter, stopAnimationMinWeeklyGross, minWeeklyGrossFilter;

margin = {
    top: 50,
    right: 50,
    bottom: 50,
    left: 50
};

width = 1200 - margin.left - margin.right;

height = 600 - margin.bottom - margin.top;
1
bbVis = {
    x: 100,
    y: 10,
    w: width - 100,
    h: height - 100
};


bbOverview = {
    x: 0,
    y: 10,
    w: width,
    h: 50
};

circleSize = {
    maxRadius: 30,
    maxLikes: 20000000,    //20m likes
    labelMoveRight: 5,
    labelMoveDown: -20
}

//tuning parameters
AxisMaxWeeklyGross = 26000000;  //just 25m for now with smaller prototype datafiles
maxMoviesPerWeek = 50;  //maximum movies to animate
likesDefault = 5000000;
animateWeeks = 12;  // 3 months to animate movies
animateDuration = 3000;  //milliseconds for complete animation
totalGrossFilter = 30000000; //total gross minimum in order be displayed
stopAnimationMinWeeklyGross = 500000;  //once weekly gross drops to minimum, stop animation and display movie
minWeeklyGrossFilter = 3000000; // Minimum weekly gross for first week of animation in order to be displayed

//other
wCounter = 1;


svg = d3.select("#mainVis").append("svg").attr({
    width: width + margin.left + margin.right,
    height: height + margin.top + margin.bottom
}).append("g").attr({
        transform: "translate(" + margin.left + "," + margin.top + ")"
    });


var color = d3.scale.category10();
color.domain(['Action','Drama','Comedy','Family','Sci-fi','Horror','Undetermined']);  //circles are colored by movie category

var movieArr = [];   // each element represents 1 week of movie data. see progress book
// weekDates - string for week, ex:January 4-10 2013
// weeklyGrossSum      - sum of weekly gross for movies
// movies   - array of data for each movie in week
//title, weeklyGross, week, theatreCount, budget, likes, category etc

d3.csv("/data/boxoffice2012master.csv", function(movieData) {
    d3.csv("/data/boxoffice2012combined.csv", function(boxOfficeData) {

        var movies = [];    // finalized array of movies in week including master attributes: likes, category etc.
        var movieWeekCnt = 0;
        var weeklyGrossSum = 0;
        var filterArr = [];  //filtered out only movies listed in master csv

        //no filtering for now
        filterArr = boxOfficeData.filter (  function (d,i) {
            if (d.totalGross >= totalGrossFilter) return true;
             else return false;
        });

        var prevWeekDates;
        filterArr.forEach( function (d, i) {

            //new week of movie data
            if (prevWeekDates != d.weekDates && i != 0) {

                weeklyGrossSum = d3.sum(movies, function (d) {
                    return d.weeklyGross;
                });

                movieArr.push({
                    weekDates:movies[0].weekDates,
                    weeklyGrossSum: weeklyGrossSum,
                    movies:movies
                });
                movies = [];  //clear out movies
                movieWeekCnt = 0;
            }

            movieWeekCnt++;
            weeklyGrossSum +=  +d.weeklyGross;

            var summary = getSummary(d.title);
            var movie =  {
                title: d.title,
                theatreCount: +d.theatreCount,
                totalGross: +d.totalGross,
                url: d.url,
                week: +d.week,
                weekDates: d.weekDates,
                weeklyGross: +d.weeklyGross,
                year: d.year,
                likes: summary.likes,
                category: summary.category,
                rank: +summary.rank
            };

            if (movieWeekCnt <= maxMoviesPerWeek) {
                movies.push(movie);
            }
            prevWeekDates = d.weekDates;
        });

        /*      var movieArr = [];   // each element represents 1 week of movie data. see progress book
         // weekDates - string for week, ex:January 4-10 2013
         // weeklyGrossSum  - sum of weekly gross for movies
         // movies   - array of data for each movie in week
         //title, weeklyGross, week, theatreCount, budget, likes, category etc
         */

        console.log('movieArr',movieArr);

        return createVis();

    });

    function getSummary (title) {
        for (var m = 0; m < movieData.length; m++) {
            if (movieData[m].title == title) {
                return movieData[m];
            }
        }
        return {likes:likesDefault, category:'Undetermined', rank:100};  //default for non-filtered
    }
});

createVis = function() {

    var displayIdx = 0;  // display index for movieArr prototype hardcoded to zero

    yScale = d3.scale.linear()
        .domain([0,AxisMaxWeeklyGross])
        .range([bbVis.h, 0]);

    yAxis = d3.svg.axis()
               .scale(yScale)
               .orient("left");

    xScale = d3.scale.linear()
        .domain([0,animateWeeks])
        .range([0,  bbVis.w]);

    xAxis = d3.svg.axis().scale(xScale).orient("bottom");

    rScale = d3.scale.linear()
        .domain([0,circleSize.maxLikes])
        .range([0, circleSize.maxRadius]);


    // example that translates to the bottom left of our vis space:
    vis = svg.append("g").attr({
        "transform": "translate(" + bbVis.x + "," + (bbVis.y) + ")"
    });

    vis.append("rect");

    //add Y axis
    vis.append("g")
        .attr("class", "y axis")
        .attr("transform",  "translate(0,-20)")  //adjust to move axis down
        .call(yAxis);

    vis.append("text")
        .attr("class", "y axislabel")
        .attr("text-anchor", "end")
        .attr("y", 6)
        .attr("dy", ".90em")
        .attr("transform",  "translate(0,0) rotate(-90)")
        .text("weekly gross");

    vis.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate("+0+"," + (bbVis.y + bbVis.h) + ")")//move right 100, down 110
        .call(xAxis);

    vis.append("text")
        .attr("class", "x axislabel")
        .attr("text-anchor", "end")
        .attr("x", bbVis.w+ 20)
        .attr("y", bbVis.h + 50)
        .text("weeks in theatres");

    vis.append("text")
        .attr("class", "x weeklabel")
        .attr("text-anchor", "end")
        .attr("x", bbVis.x)
        .attr("y", bbVis.h + 50)
        .style("fill", "darkslateblue")
        .text(movieArr[displayIdx].weekDates);

    var legend = vis.selectAll(".legend")
        .data(color.domain())
        .enter().append("g")
        .attr("class", "legend")
        .attr("transform", function(d, i) {
            return "translate("+bbVis.w+"," + (bbVis.y + (i * 25)) + ")"; });

    legend.append("rect")
        .attr("width", 22)
        .attr("height", 22)
        .style("fill", color);

    legend.append("text")
        .attr("x", -10)
        .attr("y", 10)
        .classed("legendlabel",true)
        .attr("dy", ".35em")
        .style("text-anchor", "end")
        .text(function(d) {return d;});

    animateVis('January 27-February 2 2012');
}

//returns index in MovieArry given weekDates
function weekIndex(weekDates) {
    for(var i=0; i< movieArr.length; i++) {
        if (movieArr[i].weekDates == weekDates)
            return i;
    }
    return null;
}
//gets data from movie node
function movieNodeData (movieNode) {
    return movieNode.data()[0];
}

//gets movie week data from Movie Array
function movieWeekData (title, weekIndex) {
    if (weekIndex < movieArr.length) {  //index must be in bounds
        for (var m = 0; m < movieArr[weekIndex].movies.length; m++) {
            //console.log(movieArr[weekIndex].movies[m].title, title);
            if (movieArr[weekIndex].movies[m].title == title) {
                return movieArr[weekIndex].movies[m];
            }
        }
    }
    return null;
}

function moveMovie() {

    var movie = d3.select(this);
    var mData = movieNodeData (movie);
    var week = mData.week;
    var aWeek = 1;  //animation counter , always <= animateWeeks
    var aData = [];  //new data to bind after every animation

  // if (mData.title == 'Mission: Impossible - Ghost Protocol') {

    (function move() {
        if (aWeek <= (animateWeeks)) {

            aData[0] = movieWeekData (mData.title, weekIndex(mData.weekDates) + aWeek); //gets movie data for current animation
     //       console.log('move title=', mData.title,'week=',week,'aWeek=',aWeek,'aData[0]=',aData[0]);

            if (aData[0] != null && aData[0].weeklyGross >= stopAnimationMinWeeklyGross ) {
                movie
                    .data(aData)
                    .transition()
                    .duration(animateDuration/animateWeeks)
                    .ease('linear')
                    .attr("cx", function(d) {return xScale(week);})
                    .attr("cy", function(d) { return yScale(d.weeklyGross); })
                    .attr("class", 'movie '+mData.title)
                    .each("end", move);

                week++;
            } else {
              //tuning>: offset the movies at their final stopping point
                movie
                    .transition()
                    .duration(animateDuration/animateWeeks)
                    .ease('linear')
                    .attr("cx", function(d) {return xScale(week + Math.random()); });
            }

        } else {
            if (week == aWeek) {
               movie.remove();  //remove if it gets to the end od animation weeks
            }
        }
        aWeek++;
    })();

   // }
}

//adds movies to animation. appear on left at week 1
function addMoviesToAnimation() {
    console.log('addMoviesToAnimation',wCounter);
    wCounter++;

   /*
    var w = firstWeekIndex+week-1;  // as animation moves, index of movieArr for first week changes
    if (week > 1) {   // add movies to animation , after animation moves to week 2,3,4 etc

        //get week 1 movies to add to animation
        var firstWeekMovies = movieArr[w].movies.filter (  function (d,i) {
            if (d.week=1) {
                return true;
            }  else return false

        });

   //     console.log('firstWeekMovies',firstWeekMovies);

        var movieGroups = vis.selectAll(".moviegroup")
            .data(firstWeekMovies, function(d) { return d.title; })
            .enter()
            .append("g")
            .classed("moviegroup",true);

        var movies = movieGroups
            .append("circle")
            .attr("stroke", "blue")
            .classed("movie",true)
            .attr("fill", function(d) { return color(d.category); })
            .attr("cx", function(d) { return xScale(d.week);})
            .attr("cy", function(d) { return yScale(d.weeklyGross); })
            .attr("r", function(d) { return rScale(d.likes); });
    }
    */
}

function animateVis (weekDates) {

    firstWeekIndex = weekIndex(weekDates);

    //tuning: filter movies by minimum weekly gross in order display in animation
    var filterWeekMovies =movieArr[firstWeekIndex].movies.filter (  function (d) {
        if (d.weeklyGross >= minWeeklyGrossFilter ) {
            return true;
        }  else {return false;}
    });

    var movieGroups = vis.selectAll(".moviegroup")
        .data(filterWeekMovies)
        .enter()
        .append("g")
        .classed("moviegroup",true);

    var movies = movieGroups
        .append("circle")
        .attr("stroke", "blue")
        .attr("class",  function(d) { return 'movie '+d.title;})
        .attr("fill", function(d) { return color(d.category); })
        .attr("cx", function(d) { return xScale(d.week);})
        .attr("cy", function(d) { return yScale(d.weeklyGross); })
        .attr("r", function(d) { return rScale(d.likes); });

    svg.selectAll("circle")
        .transition()
        .duration(animateDuration)
        .delay(500)
        .each (moveMovie);

    /*
     var movielabels = movieGroups
     .append("text")
     .classed("movielabel",true)
     .attr("x", function(d) { return xScale(d.week);})
     .attr("y", function(d) { return yScale(d.weeklyGross);})
     .attr("dx", function(d) { return circleSize.labelMoveRight ;})
     .attr("dy",  function(d) { return circleSize.labelMoveDown;})
     .attr("text-anchor","middle")
     .text(function(d) {return (d.title + ", Likes "+ abbreviateNumber(d.likes) ); });
     */

    var w = 1;
    d3.timer(function() {
        if (w <= animateWeeks) {
            console.log('w',w);
           setTimeout(addMoviesToAnimation, (animateDuration/animateWeeks * w));
            w++;
            return false;
        } else return true;
    });

};


// Citing Phillip Lenssen
// http://stackoverflow.com/questions/10599933/convert-long-number-into-abbreviated-string-in-javascript-with-a-special-shortn
//
function abbreviateNumber(value) {
    var newValue = value;
    if (value >= 1000) {
        var suffixes = ["", "k", "m", "b","t"];
        var suffixNum = Math.floor( (""+value).length/3 );
        var shortValue = '';
        for (var precision = 2; precision >= 1; precision--) {
            shortValue = parseFloat( (suffixNum != 0 ? (value / Math.pow(1000,suffixNum) ) : value).toPrecision(precision));
            var dotLessShortValue = (shortValue + '').replace(/[^a-zA-Z 0-9]+/g,'');
            if (dotLessShortValue.length <= 2) { break; }
        }
        if (shortValue % 1 != 0)  shortNum = shortValue.toFixed(1);
        newValue = shortValue+suffixes[suffixNum];
    }
    return newValue;
}