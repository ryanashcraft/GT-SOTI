var margin = {top: 30, right: 10, bottom: 10, left: 10};

var width = $("#d3").width() - margin.left - margin.right;
var height = $("#d3").height() - margin.top - margin.bottom;

// Set up the SVG
var svg = d3.select("#d3").append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom);

var context = svg.append("g")
  .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

// Load the JSON
var transcriptFiles = [
  'data/08_28_2012_Bud_Peterson.json',
  'data/08_28_2013_Bud_Peterson.json',
  'data/08_28_2014_Bud_Peterson.json',
  'data/08_27_2015_Bud_Peterson.json'
];
async.map(transcriptFiles, d3.json, onDataLoaded);

function onDataLoaded(error, data) {
  var year = d3.scale.ordinal()
    .rangeRoundBands([0, width], 0.1);

  var yearAxis = d3.svg.axis()
    .scale(year)
    .orient("top");

  year.domain(data.map(function(d) { return d["metadata"]["date"]["year"]; }));

  svg.append("g")
    .attr("class", "year axis")
    .call(yearAxis);

  // Draw words now
  data.forEach(function(addressData, addressIndex) {
    var wordCount = addressData["metadata"]["word count"];
    var lineWordCounts = addressData["metadata"]["line word counts"];

    var locations = addressData["locations"];
    var words = [];

    for (var word in locations) {
      var wordInstances = locations[word];
      for (var i in wordInstances) {
        var wordInstance = wordInstances[i];

        var word_width = year.rangeBand() / lineWordCounts[wordInstance["line"]];

        var obj = {
          "address index": addressIndex,
          "word": word,
          "x": wordInstance["word"] * word_width,
          "y": wordInstance["line"],
          "width": word_width
        }

        words.push(obj);
      }

      addressData["words"] = words;
    }

    var lines = []

    for (var i = 0; i < addressData["metadata"]["line word counts"].length; i++) {
      lines[i] = i;
    }

    addressData["y"] = d3.scale.ordinal()
      .rangeBands([0, height], 0.5)
      .domain(lines);
  });

  function drawMatches(isMatch) {
    var words = d3.selectAll('.words');

    words.selectAll('*')
      .remove();

    words.selectAll("rect")
      .data(function(d) { return d["words"].filter(isMatch) })
      .enter()
      .append("rect")
      .attr("class", function(d) { return "word-" + d["word"] + " word"; })
      .attr("x", function(d) { return d["x"]; })
      .attr("y", function(d) { return data[d["address index"]].y(d["y"]); })
      .attr("width", function(d) { return d["width"]; })
      .attr("height", function(d) { return data[d["address index"]].y.rangeBand(); });
  }

  function updateCounts(isMatch) {
    var addresses = d3.selectAll(".address");

    addresses.each(function() {
      var address = d3.select(this);
      address.select("text.count")
        .text(function(d) {
          return d.words.filter(isMatch).length;
        });
    });
  }

  function drawAddresses(svg) {
    var address = svg.selectAll("g.address")
      .data(data)
      .enter()
      .append("g")
      .attr("class", "address")
      .attr("transform", function(d) {
        return "translate(" + year(d["metadata"]["date"]["year"]) + ", 10)";
      });

    address.append("text")
      .attr("x", year.rangeBand() / 2)
      .attr("y", 0)
      .attr("text-anchor", "middle")
      .text(function(d) {
        return d["metadata"]["last name"];
      });

    var pattern = address.append("pattern")
      .attr("id", "Line")
      .attr("patternUnits", "userSpaceOnUse")
      .attr("width", year.rangeBand())
      .attr("height", function(d) { return d.y.rangeBand() * 2; });

    pattern.append("rect")
      .attr("x", 0)
      .attr("y", function(d) { return d.y.rangeBand(); })
      .attr("fill", "#ddd")
      .attr("width", year.rangeBand())
      .attr("height", function(d) { return d.y.rangeBand(); });

    address.append("rect")
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", year.rangeBand())
      .attr("height", "100%")
      .attr("transform", "translate(0, 25)")
      .attr("fill", "url(#Line)");

    var words = address.append("g")
      .attr("class", "words")
      .attr("transform", "translate(0, 25)");

    address.append("text")
      .attr("class", "count")
      .attr("x", year.rangeBand() / 2)
      .attr("y", 20)
      .attr("text-anchor", "middle");
  }

  function onInputChange(e) {
    var phrase = $(this).val().split(" ")[0];

    $("span#phrase").text(phrase);

    var isMatch = function isMatch(data) {
      return !!(phrase && data.word.toLowerCase().indexOf(phrase.toLowerCase()) !== -1);
    };

    drawMatches(isMatch);
    updateCounts(isMatch);
  }

  var isMatch = function isMatch(data) {
    var phrase = $("input").val();
    return !!(phrase && data.word.toLowerCase().indexOf(phrase.toLowerCase()) !== -1);
  };

  drawAddresses(context);
  drawMatches(isMatch);
  updateCounts(isMatch);
  $("input").bind("keyup", _.debounce(onInputChange, 300));
};
