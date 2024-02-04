import { createRaceBarChart } from './raceBarChart.js';
export async function dataSelector(lib, dataType, targetElementId, chartKey){
    let response;
    const cumulativeData = {};
    response = chartKey=="name" ? await fetch('/data/companies.json'): await fetch('/data/countries.json');
    const fetchData = await response.json();
    const years =  Object.keys(fetchData[0].overall);
    if(dataType=="progressive"){
        fetchData.forEach(data => {
            cumulativeData[data[chartKey]] = { value: 0, color: data.color };
          });
          //console.log("current progressive data: ",fetchData)
          createRaceBarChart(lib, targetElementId, fetchData,cumulativeData, years, dataType, chartKey);        
    }else{
        let transformedData = [];
        function processData(data, chartKey, transformedData) {
            let years = Object.keys(data.overall);
            years.forEach(year => {
                if (data[chartKey] !== undefined) {
                    transformedData.push({
                        ...(chartKey === "name" && { name: data[chartKey] }),
                        rank: data.rank,
                        country: data.country,
                        year: year,
                        value: data.overall[year],
                        color: `hsl(${Math.random() * 360}, 100%, 50%)`
                    });
                }
            });
        }

        fetchData.forEach(data => processData(data, chartKey, transformedData));

        transformedData.forEach(data => {
            cumulativeData[data[chartKey]] = { value: 0, color: data.color };
        });
        //console.log("current year-by-year data: ",transformedData);
        createRaceBarChart(lib, targetElementId, transformedData,cumulativeData, years, dataType, chartKey);
    }
    
}