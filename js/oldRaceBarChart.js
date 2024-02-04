//usage
//drawRaceBarChart(lib, targetElementId, 500, 300, chartKey);
export async function drawRaceBarChart(d3, targetElementId, width, height, chartKey){
  let response;
  if(chartKey=="name"){
    response = await fetch('/data/institutions.json');
  }else{
    response = await fetch('/data/countries.json');
  }

  let margin = { top: 30, right: 30, bottom: 30, left: 110 };
  
  
  const fetchData = await response.json();
  const key = chartKey;
  let transformedData = [];
  function processData(data, key, transformedData) {
    let years = Object.keys(data.overall);
    years.forEach(year => {
        if (data[key] !== undefined) {
            transformedData.push({
                ...(key === "name" && { name: data[key] }),
                rank: data.rank,
                country: data.country,
                year: year,
                value: data.overall[year],
                color: `hsl(${Math.random() * 360}, 100%, 50%)`
            });
        }
    });
  }

  fetchData.forEach(data => processData(data, key, transformedData));

  const years =  Object.keys(fetchData[0].overall);
  const cumulativeData = {};

  transformedData.forEach(data => {
    cumulativeData[data[key]] = { value: 0, color: data.color };
  });

  console.log("TrasnformedData check: ",transformedData);
  width = width - margin.left - margin.right;
  height = height - margin.top - margin.bottom;

  d3.select(`#${targetElementId}`).selectAll("*").remove();

  const svg = d3.select(`#${targetElementId}`).append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  const xScale = d3.scaleLinear().range([0, width]);
  const yScale = d3.scaleBand().range([0, height]).padding(0.1);

  svg.append("g")
  .attr("class", "x-axis")
  .attr("transform", `translate(0,${height})`);

  svg.append("g")
  .attr("class", "y-axis");

  const yearLabel = svg.append("text")
    .attr("class", "current-year")
    .attr("x", width)
    .attr("y", height + margin.bottom - 40)
    .attr("text-anchor", "end")
    .attr("font-size", "1.5em")
    .text("");

  function draw(year) {
    const sortedData = transformedData
          .filter(d => d.year === year)
          .sort((a, b) => d3.descending(a.value, b.value));

      xScale.domain([0, d3.max(sortedData, d => d.value)]);
      yScale.domain(sortedData.map(d => d[key]));
    
    svg.select(".x-axis")
      .transition().duration(1000)
      .call(d3.axisBottom(xScale));

    svg.select(".y-axis")
      .transition().duration(1000)
      .call(d3.axisLeft(yScale));

    const bars = svg.selectAll(".bar").data(sortedData, d => d[key]);

    bars.enter().append("rect")
      .attr("class", "bar")
      .attr("fill", d => d.color)
      .merge(bars)
      .transition().duration(1000)
      .attr("x", d => xScale(cumulativeData[d[key]].value))
      .attr("y", d => yScale(d[key]))
      .attr("width", d => xScale(d.value))
      .attr("height", yScale.bandwidth());

    const labels = svg.selectAll(".label").data(sortedData, d => d[key]);

    labels.enter().append("text")
      .attr("class", "label")
      .merge(labels)
      .transition().duration(1000)
      .attr("x", d => xScale(d.value) - 3)
      .attr("y", d => yScale(d[key]) + yScale.bandwidth() / 2)
      .attr("dy", "0.35em")
      .attr("text-anchor", "end")
      .text(d => `${d.value.toFixed(2)}`); //to show only value

    yearLabel.text(year);
    bars.exit().remove();
    labels.exit().remove();
  }

  function animate() {
    let index = 0;
    function nextFrame() {
      if (index < years.length) {
        draw(years[index]);
        index++;
        setTimeout(nextFrame, 1000);
      } else {
          let replayButton = document.getElementById('replayButton');
          replayButton.style.display = 'block';
          replayButton.innerHTML = '<i class = "bi bi-arrow-repeat"></i> Replay';
        
      }
    }
    nextFrame();
  }

  animate();

  document.getElementById('replayButton').addEventListener('click', function() {
    transformedData.forEach(data => {
      cumulativeData[data[chartKey]].value = 0;
    });
    this.style.display = 'none';
    animate();
  });
};