/**
 * Chris Leuer
 * Box Office Success
 * April 2014
 */
    var bbVis, brush, createVis, dataSet, handle, height, margin, svg, svg2, width,
        circleSize, maxWeeklyGross, maxMoviesPerWeek, vis, xScale, yScale, yAxis, xAxis, rScale, animateDuration;

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
        maxRadius: 50,
        maxLikes: 20000000,    //20m likes
        labelMoveRight: 5,
        labelMoveDown: -20
    }

    maxWeeklyGross = 25000000;  //just 25m for now with smaller prototype datafiles
    maxMoviesPerWeek = 20;
    likesDefault = 1000000;
    animateWeeks = 12;  // 3 months to animate movies
    animateDuration = 3000;  //milliseconds for complete animation



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

        // get estimate categories from first row of data
        //pCats = d3.keys(data[0]).filter(function(key) { return key !== "Year"; });
        //color.domain(pCats);  //each category gets a color


        d3.csv("/data/boxoffice2012combined.csv", function(boxOfficeData) {

            var movies = [];    // finalized array of movies in week including master attributes: likes, category etc.
            var movieWeekCnt = 0;
            var weeklyGrossSum = 0;
            var filterArr = [];  //filtered out only movies listed in master csv


            //no filtering for now
            filterArr = boxOfficeData.filter (  function (d,i) {
                
                 /*   for (var m = 0; m < movieData.length; m++) {
                          if (movieData[m].title == d.title) {
                              return true;
                          }
                    }
                    return false;
                  */
                return true;

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
        .domain([0,maxWeeklyGross])
        .range([bbVis.h, 0]);

    yAxis = d3.svg.axis().scale(yScale).orient("left");

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
        .attr("transform",  "translate(0,0)")  //adjust to move axis down
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

function weekIndex(weekDates) {
    for(var i=0; i< movieArr.length; i++) {
        if (movieArr[i].weekDates == weekDates)
            return i;
    }
}

function moveMovie() {
    var movie = d3.select(this);
    var week = movie.data()[0].week;  //fix

    (function move() {
        console.log("move, week=",week);

        if (week <= animateWeeks) {
        movie
            .transition()
            .duration()
            .attr("cx", function(d) {
                return xScale(week);})
            .each("end", move);
        week++;
        } else {
            movie.remove();
        }
    })();
}

function animateVis (weekDates) {

    var w = weekIndex(weekDates);

    var movieGroups = vis.selectAll(".moviegroup")
        .data(movieArr[w].movies)
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