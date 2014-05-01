/**
 * Chris Leuer
 * Box Office Success Visualization
 * April 2014
 */
var bbVis, brush, createVis, dataSet, handle, height, margin, svg, svg2, width,
    circleSize, maxWeeklyGross, maxMoviesPerWeek, vis, xScale, yScale, yAxis, xAxis, rScale, animateDuration,
    firstWeekIndex, minTotalGrossFilter, stopAnimationMinWeeklyGross, minWeeklyGrossFilter, animationOffsetScale,
    wCounter,startAnimationWeek, currentAnimation, startMovieDelay, barXScale, barYScale, moveAlive, tip;

margin = {
    top: 10,
    right: 50,
    bottom: 10,
    left: 50
};

width = 1200 - margin.left - margin.right;
height = 550 - margin.bottom - margin.top;

bbVis = {
    x: 100,
    y: 5,
    w: width - 100,
    h: height - 100
};


barmargin = {
    top: 0,
    right: 50,
    bottom: 200,
    left: 50
};

barwidth = 1200 - barmargin.left - barmargin.right;
barheight = 320 - barmargin.top - barmargin.bottom;

circleSize = {
    maxRadius: 30,
    minLikeRadius:1,
    maxLikesRadius: 100,    //larger range size for popular movies
    labelMoveRight: 5,
    labelMoveDown: -20
}

//tuning parameters
AxisMaxWeeklyGross = 200000000;  //
maxMoviesPerWeek = 50;  //maximum movies to animate
likesDefault = 5000000;
animateWeeks = 12;  // 3 months to animate movies
animateDuration = 30000;  //milliseconds for complete animation
minTotalGrossFilter = 18000000; //total gross minimum in order be displayed
maxTotalGrossOffset = 500000000;  //just for an offset to get movies to display at different positions
stopAnimationMinWeeklyGross = 0;  //once weekly gross drops to minimum, stop animation and display movie
minWeeklyGrossFilter = 5000000; // Minimum weekly gross for first week of animation in order to be displayed
startAnimationWeek ='January 6-12 2012';  //default week to start animation
startMovieDelay = 200;  //milliseconds before the movie starts moving

//globals, do not change
movieSizeOption = 'theatres';  //sized by theatres by default. options are theatres,likes,audience,critics
currentAnimation = 0;  // a unique animation number is incremented each time the animation is restarted by user
moveAlive = true;   // signals circle animation is alive and not stopped

//draw canvas item
svg = d3.select("#mainVis").append("svg").attr({
    width: width + margin.left + margin.right,
    height: height + margin.top + margin.bottom
}).append("g").attr({
        transform: "translate(" + margin.left + "," + margin.top + ")"
    });

barsvg = d3.select("#mainVis").append("svg").attr({
    width: barwidth + barmargin.left + barmargin.right,
    height: barheight + barmargin.top + barmargin.bottom
}).append("g").attr({
        transform: "translate(" + barmargin.left + "," + barmargin.top + ")"
    });

var color = d3.scale.category10();
color.domain(['Action','Drama','Comedy','Family','Sci-fi','Horror','Documentary','Undetermined']);

var masterMovieData;

var movieArr = [];   // each element represents 1 week of movie data. see progress book
// weekDates - string for week, ex:January 4-10 2013
// weeklyGrossSum      - sum of weekly gross for movies
// movies   - array of data for each movie in week
//title, weeklyGross, week, theatreCount, budget, likes, category etc

d3.csv("./data/moviemaster.csv", function(movieData) {

    masterMovieData = movieData;
    d3.csv("./data/boxoffice2012combined.csv", function(boxOfficeData) {

        var movies = [];    // finalized array of movies in week including master attributes: likes, category etc.
        var movieWeekCnt = 0;
        var weeklyGrossSum = 0;
        var filterArr = [];  //filtered out only movies listed in master csv

        //no filtering for now
        filterArr = boxOfficeData.filter (  function (d,i) {
            if (d.totalGross >= minTotalGrossFilter) return true;
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
                likes: +summary.likes,
                category: summary.category,
                audienceScore: +summary.audienceScore,
                criticsScore: +summary.criticsScore,
                releaseDate: summary.releaseDate
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
         //title, weeklyGross, week, theatreCount,  likes, category, audienceScore, criticsScore, releaseDate
         */

       // console.log('movieArr',movieArr);
        return createVis();
    });

    function getSummary (title) {
        for (var m = 0; m < movieData.length; m++) {
            if (movieData[m].title == title) {
                return movieData[m];
            }
        }
        //default for non-filtered
        return {likes:likesDefault, category:'Undetermined', audienceScore:50,
                criticsScore:50, releaseDate: '1900-01-01' };
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

    tip = d3.tip()
        .attr('class', 'd3-tip')
        .offset([-10, 0])
        .html(function(d) { return movieTip(d);});

    svg.call(tip);

    animationOffsetScale = d3.scale.linear()//fix: find better way to distribute
        .domain([0,maxTotalGrossOffset])
        .range([0,1]);    //used to distribute final location according to gross so they are not stacked

    // example that translates to the bottom left of our vis space:
    vis = svg.append("g").attr({
        "transform": "translate(" + bbVis.x + "," + (bbVis.y) + ")"
    });

    vis.append("rect");

    //add Y axis
    vis.append("g")
        .attr("class", "y axis")
        .attr("transform",  "translate(0,0)")  //adjust
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
        .attr("x", bbVis.x + 50)
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

    //bar chart
    // citing http://bl.ocks.org/mbostock/3885304

    barXScale = d3.scale.ordinal()
        .rangeRoundBands([0,bbVis.w], .1);

    barYScale = d3.scale.linear()
        .range([barheight, 0]);

    barvis = barsvg.append("g").attr({
        "transform": "translate(" + bbVis.x + "," + (bbVis.y) + ")"
    });

    barXScale.domain(movieArr.map(function(d) { return d.weekDates; }));
    barYScale.domain([0, d3.max(movieArr, function(d) { return d.weeklyGrossSum; })]);

    var barXAxis = d3.svg.axis()
        .scale(barXScale)
        .orient("bottom");

    var barYAxis = d3.svg.axis()
        .scale(barYScale)
        .orient("left");

    barvis.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + barheight + ")")
        .call(barXAxis)
        .selectAll("text")
        .classed("barxaxistick",true)
        .attr("y", 0)
        .attr("x", -10)
        .attr("dy", "0em")
        .attr("transform", "rotate(-90)")
        .style("text-anchor", "end");

    barvis.append("g")
        .attr("class", "y axis")
        .call(barYAxis)
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 6)
        .attr("dy", ".71em")
        .style("text-anchor", "end")
        .text("All Movies Gross");

    barvis.selectAll(".bar")
        .data(movieArr)
        .enter().append("rect")
        .attr("class", "bar")
        .attr("id", function (d,i){return i;})
        .attr("x", function(d) { return barXScale(d.weekDates); })
        .attr("width", barXScale.rangeBand())
        .attr("y", function(d) { return barYScale(d.weeklyGrossSum); })
        .attr("height", function(d) { return (barheight - barYScale(d.weeklyGrossSum)); })
        .on("click", function(d) { chooseWeek($(this).attr('id')) })
    ;

    animateVis(startAnimationWeek);
}

//animation main
function animateVis (weekDates) {

    removeMovieGroups();
    currentAnimation++;  //allows timed addMoviesAnimation to know if it's animating a stopped animation
    wCounter = 1;   //week animation counter, restarts at 1 for every animation
    firstWeekIndex = weekIndex(weekDates) - 1;  //-1 trick get week 1 data to show at 0 X position

    changeWeekLabel(weekIndex(weekDates));

    var w = 1;
    d3.timer(function() {
        if (w <= animateWeeks) {
            setTimeout(addMoviesToAnimation, (animateDuration/animateWeeks * w),currentAnimation);
            w++;
            return false;
        } else return true;
    });

}

//adds movies to animation and starts move
function addMoviesToAnimation(animation) {

    if (currentAnimation == animation) {   //prevents older timed animations from running

        moveAlive = true;
        var filterWeekMovies = [];
        var cpZeroWeekMovies = [];

        changeWeekLabel (firstWeekIndex + wCounter) ;

        if (wCounter == 1 && firstWeekIndex >= 0 ) {
            //tuning: also, filter movies by minimum weekly gross
            filterWeekMovies =movieArr[firstWeekIndex].movies.filter (  function (d) {
                if (d.weeklyGross >= minWeeklyGrossFilter  ) {
                    return true;  // return all movies at min weekly gross
                }  else {return false;}
            });
        }

        //populate week 1 from next movieArr, these will start animation at position zero
        var weekIndex = firstWeekIndex + wCounter; //next index in movieArr
        if (weekIndex < movieArr.length) {
            var zeroWeekMovies =movieArr[weekIndex].movies.filter (  function (d) {
                if (d.weeklyGross >= minWeeklyGrossFilter && d.week == 1  ) {
                    return true;  // return all movies at min weekly gross
                }  else {return false;}
            });

            // copy zeroWeekMovies array to new one with zeros for week and weeklyGross
            zeroWeekMovies.forEach ( function (d) {
                var zeroMovie = copyMovieObj(d);
                zeroMovie.week=0;
                zeroMovie.weeklyGross=0;
                cpZeroWeekMovies.push(zeroMovie);
            });
        }

        var animateWeekMovies = filterWeekMovies.concat(cpZeroWeekMovies);
        var groupClass = 'moviegroup'+ wCounter.toString();
        var movieGroups = vis.selectAll('.'+groupClass)
            .data(animateWeekMovies)
            .enter()
            .append("g")
            .classed("moviegroup m-"+animation.toString(),true);

        var movieClass = 'movie';
//    var movieClass = 'movie'+wCounter.toString();
        var movies = movieGroups
            .append("circle")
            .attr("stroke", "blue")
            .classed(movieClass,true)
//        .attr("class",  function (d) {return movieClass+' '+ d.title})
            .attr("fill", function(d) { return color(d.category); })
            .attr("cx", function(d) { return xScale(d.week);})
            .attr("cy", function(d) { return yScale(d.weeklyGross); })
            .attr("r", function(d) { return movieSize(d); })
            .on('mouseover', tip.show)
            .on('mouseout', tip.hide)
            .on("click", function(d,i) { freezeAnimation(); });

        movies
            .transition()
            .duration(animateDuration)
            .delay(startMovieDelay)
            .each (moveMovie);

        var movieLabels = movieGroups
            .append("text")
            .classed("movielabel",true)
            .attr("x", function(d) { return xScale(d.week);})
            .attr("y", function(d) { return yScale(d.weeklyGross);})
            .attr("dx", function(d) { return circleSize.labelMoveRight ;})
            .attr("dy",  function(d) { return circleSize.labelMoveDown;})
            .attr("text-anchor","middle")
            .text(function(d) {return d.title; });

        movieLabels
            .transition()
            .duration(animateDuration)
            .delay(startMovieDelay)
            .each (moveMovieLabel);

        wCounter++;
    } else {
        moveAlive = false;
        vis.selectAll(".m-"+animation.toString()).remove();
    }
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
    var aWeek = wCounter;
    var aData = [];  //new data to bind after every animation

    (function move() {
        if (aWeek <= (animateWeeks) && moveAlive) {

       //     var prevAnimation = currentAnimation - 1;
       //     vis.selectAll(".m-"+prevAnimation.toString()).remove();  //get really aggressive about removing past movies

            //gets movie data for animation to next week
            aData[0] = movieWeekData (mData.title, firstWeekIndex + aWeek);
            if (aData[0] != null && aData[0].weeklyGross >= stopAnimationMinWeeklyGross ) {
                var movieClass = 'm-movie'+ aWeek.toString() + ' movie';
                movie
                    .data(aData)
                    .transition()
                    .duration(animateDuration/animateWeeks)
                    .ease('linear')
                    .attr("cx", function(d) {return xScale(week + 1);})
                    .attr("cy", function(d) { return yScale(d.weeklyGross); })
                    .attr("class",  function (d) {return movieClass})
                    .attr("r", function(d) { return movieSize(d); })
                    .each("end", move);

                week++;
            } else if (aWeek >= 7 ) {  //offset after 7 weeks
              //tuning>: offset the movies at their final stopping point
                movie
                    .transition()
                    .duration(animateDuration/animateWeeks)
                    .ease('linear')
                    .attr("cx", function(d) {return xScale(week + animationOffsetScale(d.totalGross)); });
            }

        } else {
            if (week == aWeek) {
               movie.remove();  //remove if it gets to the end od animation weeks
            }
        }
        aWeek++;
    })();
}

// move movie label
function moveMovieLabel() {
    var movieLabel = d3.select(this);
    var mData = movieNodeData (movieLabel);
    var week = mData.week;
    var aWeek = wCounter;
    var aData = [];  //new data to bind after every animation

    (function move() {
        if (aWeek <= (animateWeeks) && moveAlive) {

            //gets movie data for animation to next week
            aData[0] = movieWeekData (mData.title, firstWeekIndex + aWeek);
            if (aData[0] != null && aData[0].weeklyGross >= stopAnimationMinWeeklyGross ) {
               if (week >= 6){
                    movieLabel.remove();  //remove to prevent clutter at end animation
                } else {
                var movieClass = 'm-movielabel'+ aWeek.toString();
                movieLabel
                    .data(aData)
                    .transition()
                    .duration(animateDuration/animateWeeks)
                    .ease('linear')
                    .attr("x", function(d) {return xScale(week + 1);})
                    .attr("y", function(d) { return yScale(d.weeklyGross); })
                    .each("end", move);

                week++;
               }
            }

        } else {
            if (week == aWeek) {
                movieLabel.remove();  //remove if it gets to the end od animation weeks
            }
        }
        aWeek++;
    })();
}

//changes X axis week label
function changeWeekLabel (weekIndex) {
    if (weekIndex < movieArr.length) {
        vis.select('.weeklabel').text(movieArr[weekIndex].weekDates);
    }
}

function removeMovieGroups () {
    var movieGroups = vis.selectAll('.moviegroup');
    movieGroups.remove();
}

function getMovieScale () {

    var mScale = d3.scale.linear();

    if (movieSizeOption == 'theatres') {

        mScale
            .domain([0,d3.max(movieArr,
                function (d) {
                    return d3.max(d.movies, function (movie) {
                        return +movie.theatreCount;
                    })
                })
            ])
            .range([0, circleSize.maxRadius]);

    } else if (movieSizeOption == 'likes') {

        mScale
            .domain([0,d3.max(masterMovieData,
              function (d) {
                  return +d.likes
              })
            ])
            .range([circleSize.minLikeRadius, circleSize.maxLikesRadius]);

    }  else if (movieSizeOption == 'audience' || movieSizeOption =='critics' ) {

        mScale
            .domain([0,100])   //0-100 score from Rotten Tomatoes
            .range([0, circleSize.maxRadius]);
    }
    return mScale;
}

function movieSize (movie) {

    var mScale = getMovieScale();
    var R;
    if (movieSizeOption == 'theatres')  {R = mScale(movie.theatreCount); }
    else if (movieSizeOption == 'likes') {R = mScale(movie.likes); }
    else if (movieSizeOption == 'audience') {R = mScale(movie.audienceScore); }
    else if (movieSizeOption == 'critics') {R = mScale(movie.criticsScore); }

    return R;
}

function movieTip (movie) {

    var optionTitle, dimension;
    var titleHTML = '<strong>'+movie.title+'</strong><br>';
    var parse = d3.time.format("%Y-%m-%d").parse;
    var formatDate = d3.time.format("%B %d, %Y");
    var releaseDate = formatDate(parse(movie.releaseDate));
    var releaseDateHTML = "<strong>Release date: </strong>"+releaseDate+'<br>';



    console.log(releaseDate);

    if (movieSizeOption == 'theatres')  {
        optionTitle = 'Theatres';
        dimension = movie.theatreCount;
    } else if (movieSizeOption == 'likes') {
        optionTitle = 'Likes';
        dimension = abbreviateNumber(movie.likes);
    } else if ( movieSizeOption == 'audience') {
        optionTitle = 'Audience Score';
        dimension = movie.audienceScore.toString() +'%';
    } else if (movieSizeOption == 'critics') {
        optionTitle = 'Critics Score';
        dimension = movie.criticsScore.toString() +'%';
    }
    return titleHTML + releaseDateHTML+"<strong>"+optionTitle+":</strong> <span style='color:red'>" + dimension + "</span>";
}

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

function chooseWeek (weekIndex) {

    $("rect.bar.active").removeClass("active");
    var id = $(this).attr('id');
    $("#"+id).addClass('active');
    animateVis(movieArr[+weekIndex].weekDates);
}

//copy week to prevent object references in movieArr
function copyMovieObj (movie) {
    return {
        category: movie.category,
        likes: movie.likes,
        theatreCount: movie.theatreCount,
        title: movie.title,
        totalGross: movie.totalGross,
        url: movie.url,
        week: movie.week,
        weeklyGross: movie.weeklyGross,
        year: movie.year,
        audienceScore: movie.audienceScore,
        criticsScore: movie.criticsScore,
        releaseDate: movie.releaseDate
    }
}

function freezeAnimation () {
    currentAnimation++;
}

//event binding

// allow user to choose movie sizing option to change radius of circles. force a re-animation
$(".moviesize").click(function() {
    $("li.moviesizing.active").removeClass("active");
    $(this).closest('li').addClass('active');

    // restart animation with different sizes
    if (movieSizeOption != $(this).attr('id')) {
        movieSizeOption = $(this).attr('id');
        animateVis(movieArr[firstWeekIndex+1].weekDates);
    }

});
