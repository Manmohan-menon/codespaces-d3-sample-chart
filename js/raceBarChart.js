export async function createRaceBarChart(d3, targetElementId, transformedData, cumulativeData, years, dataType, chartKey) {
  const margin = { top: 30, right: 30, bottom: 30, left: 110 };
  const width = 500 - margin.left - margin.right;
  const height = 300 - margin.top - margin.bottom;
  let key = chartKey;
   
  const svg = prepareSvg(d3, targetElementId, width, height, margin);
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
     const sortedData = dataType === "progressive" ? 
       calculateProgressiveData(transformedData, cumulativeData, key, year) :
       filterAndSortDataByYear(transformedData, key, year);
 
     xScale.domain([0, d3.max(sortedData, d => dataType === "progressive" ? d[1].value: d.value)]);
     yScale.domain(sortedData.map(d => dataType === "progressive" ?d[0]:d[key]));
     
     updateAxes(svg, xScale, yScale);
     updateBarsAndLabels(svg, sortedData, xScale, yScale, key, dataType);
     yearLabel.text(year);
  }
 
  function animate() {
     let index = 0;
     function nextFrame() {
       if (index < years.length) {
         draw(years[index]);
         index++;
         setTimeout(nextFrame, 1000);
       } else {
         displayReplayButton();
       }
     }
     nextFrame();
  }
 
  animate();
 
  document.getElementById('replayButton').addEventListener('click', function() {
     resetValues(transformedData, cumulativeData, key);
     this.style.display = 'none';
     animate();
  });
 }
 
 function prepareSvg(d3, targetElementId, width, height, margin) {
  d3.select(`#${targetElementId}`).selectAll("*").remove();
  return d3.select(`#${targetElementId}`).append("svg")
     .attr("width", width + margin.left + margin.right)
     .attr("height", height + margin.top + margin.bottom)
     .append("g")
     .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
 }
 
 function calculateProgressiveData(transformedData, cumulativeData, key, year) {
  transformedData.forEach(data => {
     cumulativeData[data[key]].value += data.overall[year];
  });
 
  return Object.entries(cumulativeData)
     .sort((a, b) => d3.descending(a[1].value, b[1].value));
 }
 
 function filterAndSortDataByYear(transformedData, key, year) {
  return transformedData
     .filter(d => d.year === year)
     .sort((a, b) => d3.descending(a.value, b.value));
 }
 
 function updateAxes(svg, xScale, yScale) {
  svg.select(".x-axis")
     .transition().duration(1000)
     .call(d3.axisBottom(xScale));
 
  svg.select(".y-axis")
     .transition().duration(1000)
     .call(d3.axisLeft(yScale));
 }
 
 function updateBarsAndLabels(svg, sortedData, xScale, yScale, key, dataType) {
  const bars = svg.selectAll(".bar").data(sortedData, d => dataType === "progressive" ?d[0]:d[key]);
  const labels = svg.selectAll(".label").data(sortedData, d => dataType === "progressive" ?d[0]:d[key]);
  bars.enter().append("rect")
     .attr("class", "bar")
     .attr("fill", d => dataType === "progressive" ?d[1].color: d.color)
     .merge(bars)
     .transition().duration(1000)
     .attr("x", 0)
     .attr("y", d => yScale(dataType === "progressive" ?d[0]:d[key]))
     .attr("width", d => xScale(dataType === "progressive" ?d[1].value:d.value))
     .attr("height", yScale.bandwidth());
 
  labels.enter().append("text")
     .attr("class", "label")
     .merge(labels)
     .transition().duration(1000)
     .attr("x", d => xScale(dataType === "progressive" ?d[1].value:d.value) - 3)
     .attr("y", d => yScale(dataType === "progressive" ?d[0]:d[key]) + yScale.bandwidth() / 2)
     .attr("dy", "0.35em")
     .attr("text-anchor", "end")
     .text(d => dataType === "progressive" ?`${d[1].value.toFixed(2)}`:`${d.value.toFixed(2)}`);
 
  bars.exit().remove();
  labels.exit().remove();
 }
 
 function displayReplayButton() {
  let replayButton = document.getElementById('replayButton');
  replayButton.style.display = 'block';
  replayButton.innerHTML = '<i class = "bi bi-arrow-repeat"></i> Replay';
 }
 
 function resetValues(transformedData, cumulativeData, key) {
  transformedData.forEach(data => {
     cumulativeData[data[key]].value = 0;
  });
 }
 