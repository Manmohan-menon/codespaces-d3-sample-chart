export async function createRaceBarChart(d3, targetElementId, transformedData, cumulativeData, years, dataType, chartKey) {
  const margin = { top: 30, right: 30, bottom: 30, left: 110 };
  let width = document.getElementById(targetElementId).clientWidth;
  width = width - margin.left - margin.right;
  let height =  document.getElementById(targetElementId).clientHeight;
  height= height - margin.top - margin.bottom;

   
  const svg = prepareSvg(d3, targetElementId, width, height, margin);
  const xScale = d3.scaleLinear().range([0, width]);
  const yScale = d3.scaleBand().range([0, height]).padding(0.1);
 
  svg.append("g")
     .attr("class", "x-axis")
     .attr("transform", `translate(0,${height})`);
 
  svg.append("g")
     .attr("class", "y-axis");
   
   function appendText(svg, x, y, labelClass, textAnchor, fontSize) {
      return svg.append("text")
         .attr("class", labelClass)
         .attr("x", x)
         .attr("y", y)
         .attr("text-anchor", textAnchor)
         .attr("font-size", fontSize)
         .text("");
   }
     
   let yearLabel, noteLabel;
     
   if(dataType == "year-by-year" && chartKey == "country"){
      yearLabel = appendText(svg, width, height + margin.bottom - 80,"current-year", "end", "1.5em");
      noteLabel = appendText(svg, width, height + margin.bottom - 40, "current-note","end", "1.5em");
   } else {
      yearLabel = appendText(svg, width, height + margin.bottom - 40, "current-year","end", "1.5em");
   }
   function getNoteText(year) {
      const noteMap = {
        "2018": "Previous share of the Companies",
        "2021": "Shares of the Companies",
        "Present": "Leading share of the Companies in the present fiscal year"
      };
      const defaultNote = "";
      let note = noteMap[year] || defaultNote
      return note;
   }
 
  function draw(year) {
     const sortedData = dataType === "progressive" ? 
       calculateProgressiveData(transformedData, cumulativeData, chartKey, year) :
       filterAndSortDataByYear(transformedData, chartKey, year);
 
     xScale.domain([0, d3.max(sortedData, d => dataType === "progressive" ? d[1].value: d.value)]);
     yScale.domain(sortedData.map(d => dataType === "progressive" ?d[0]:d[chartKey]));
     
     updateAxes(svg, xScale, yScale);
     updateBarsAndLabels(svg, sortedData, xScale, yScale, chartKey, dataType);
     yearLabel.text(year);
     if(dataType == "year-by-year" && chartKey == "country"){
      noteLabel.text(getNoteText(year));
     } 
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
     resetValues(transformedData, cumulativeData, chartKey);
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
 
 function calculateProgressiveData(transformedData, cumulativeData, chartKey, year) {
  transformedData.forEach(data => {
     cumulativeData[data[chartKey]].value += data.overall[year];
  });
 
  return Object.entries(cumulativeData)
     .sort((a, b) => d3.descending(a[1].value, b[1].value));
 }
 
 function filterAndSortDataByYear(transformedData, chartKey, year) {
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
 
 function updateBarsAndLabels(svg, sortedData, xScale, yScale, chartKey, dataType) {
  const bars = svg.selectAll(".bar").data(sortedData, d => dataType === "progressive" ?d[0]:d[chartKey]);
  const labels = svg.selectAll(".label").data(sortedData, d => dataType === "progressive" ?d[0]:d[chartKey]);
  bars.enter().append("rect")
     .attr("class", "bar")
     .attr("fill", d => dataType === "progressive" ?d[1].color: d.color)
     .merge(bars)
     .transition().duration(1000)
     .attr("x", 0)
     .attr("y", d => yScale(dataType === "progressive" ?d[0]:d[chartKey]))
     .attr("width", d => xScale(dataType === "progressive" ?d[1].value:d.value))
     .attr("height", yScale.bandwidth());
 
  labels.enter().append("text")
     .attr("class", "label")
     .merge(labels)
     .transition().duration(1000)
     .attr("x", d => xScale(dataType === "progressive" ?d[1].value:d.value) - 3)
     .attr("y", d => yScale(dataType === "progressive" ?d[0]:d[chartKey]) + yScale.bandwidth() / 2)
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
 
 function resetValues(transformedData, cumulativeData, chartKey) {
  transformedData.forEach(data => {
     cumulativeData[data[chartKey]].value = 0;
  });
 }
 