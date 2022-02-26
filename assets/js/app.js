const form = document.querySelector("form");
const cityInputEl = document.querySelector("#city");
const currentDataContainer = document.querySelector(
  "#current-weather-container"
);
const forecastContainer = document.querySelector("#forecast-container");
const cityHistory = document.querySelector("#search-history");
const myLocation = document.querySelector("#my-location");
let date = moment().format("MM/DD/YYYY");
let pastCities = [];

// first convert city to geo data
const getGeoData = async function (city) {
  const respons = await axios.get(
    `https://api.openweathermap.org/geo/1.0/direct?q=${city},US&appid=c20b708b2952fc5492619c70affe0677`
  );
  if (respons) {
    const lat = respons.data[0].lat;
    const lon = respons.data[0].lon;
    const geoData = [lat, lon];
    return geoData;
  } else {
    alert("Error with geo location");
  }
};

// after getting geo data, run onecall query and build current weather data section.
const getCurrentWeatherData = function (city, lat, lon) {
  fetch(
    `https://api.openweathermap.org/data/2.5/onecall?lat=${lat}&lon=${lon}&units=imperial&appid=c20b708b2952fc5492619c70affe0677`
  ).then((res) => {
    if (res.ok) {
      res.json().then((data) => {

        lineGraph(data);
        //console.log(data.hourly);


        buildCurrentWeather(
          city,
          data.current.temp,
          data.current.wind_speed,
          data.current.humidity,
          data.current.uvi
        );
        //Loop through forecast - build out here
        for (let i = 1; i <= 5; i++) {
          buildForecast(
            moment(data.daily[i].dt * 1000).format("MM/DD/YYYY"),
            data.daily[i].weather[0].icon,
            data.daily[i].temp.day,
            data.daily[i].wind_speed,
            data.daily[i].humidity
          );
        }
      });
    } else {
      alert("An error occured");
    }
  });
};

const formSubmitHandler = async function (e) {
  e.preventDefault();
  const city = cityInputEl.value.trim();

  if (city) {
    const geoData = await getGeoData(city);

    //update history
    if (pastCities.length > 0) {
      for (let i = 0; i < pastCities.length; i++) {
        if (city === pastCities[i]) {
          pastCities.splice(i, 1);
        }
      }
    }

    pastCities.push(city);
    saveCity();

    getCurrentWeatherData(city, geoData[0], geoData[1]);

    form.reset();
  }
};

const buildEl = function (type, text) {
  let newEl = document.createElement(type);
  newEl.textContent = text;
  return newEl;
};

const buildCurrentWeather = function (city, temp, wind, humidity, uv) {
  currentDataContainer.textContent = "";

  const cityTitle = buildEl("h3", city + " " + date);
  const cityTemp = buildEl("span", "Temp: " + temp + " ℉");
  const cityWind = buildEl("span", "Wind: " + wind + " mph");
  const cityHumid = buildEl("span", "Humidity: " + humidity + "%");
  const cityUV = buildEl("span", "UV Index: " + uv);

  currentDataContainer.append(cityTitle, cityTemp, cityWind, cityHumid, cityUV);
};

const buildForecast = function (date, icon, temp, wind, humidity) {
  if (forecastContainer.childElementCount === 5) {
    forecastContainer.textContent = "";
  }

  const div = document.createElement("div");
  div.classList = "flex-col w3-animate-zoom";
  const weatherIcon = document.createElement("img");
  weatherIcon.setAttribute(
    "src",
    "http://openweathermap.org/img/wn/" + icon + "@2x.png"
  );
  const forecastDate = buildEl("h4", date);
  const cityTemp = buildEl("span", "Temp: " + temp + " ℉");
  const cityWind = buildEl("span", "Wind: " + wind + " mph");
  const cityHumid = buildEl("span", "Humidity: " + humidity + "%");

  div.append(forecastDate, weatherIcon, cityTemp, cityWind, cityHumid);
  forecastContainer.append(div);
};

function saveCity() {
  localStorage.setItem("pastCities", JSON.stringify(pastCities));
}

function loadCities() {
  const cityData = localStorage.getItem("pastCities");
  pastCities = JSON.parse(cityData);

  if (pastCities === null) {
    pastCities = [];
    return false;
  }

  for (let i = 0; i < pastCities.length; i++) {
    const div = document.createElement("div");
    const btn = document.createElement("button");
    div.classList = "past-city-btn";
    div.innerHTML = `<i class="fa-solid fa-trash-can me-3" data-city="${pastCities[i]}"></i>`;
    btn.classList = "btn btn-secondary";
    btn.setAttribute("data-city", pastCities[i]);
    btn.textContent = pastCities[i];
    div.append(btn);
    cityHistory.append(div);
  }
}

async function pastCitiesHandler(e) {
  e.preventDefault();
  if (e.target.classList == "btn btn-secondary") {
    const city = e.target.getAttribute("data-city");

    if (city) {
      const geoData = await getGeoData(city);

      //update history
      if (pastCities.length > 0) {
        for (let i = 0; i < pastCities.length; i++) {
          if (city === pastCities[i]) {
            pastCities.splice(i, 1);
          }
        }
      }
      pastCities.push(city);
      saveCity();

      getCurrentWeatherData(city, geoData[0], geoData[1]);
    }
  }

  // Delete city option
  else if (e.target.classList == "fa-solid fa-trash-can me-3") {
    let el = e.target.parentElement;
    console.log(el);
    let deleteCity = e.target.getAttribute("data-city");
    let index = pastCities.indexOf(deleteCity);
    console.log(deleteCity, index);
    el.remove();
    pastCities.splice(index, 1);
    saveCity();
  }
}

function getLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(showPosition, handleError);
  } else {
    x.innerHTML = "Geolocation is not supported by this browser.";
  }
}

function showPosition(position) {
  const lat = position.coords.latitude;
  const long = position.coords.longitude;
  getCurrentWeatherData("My Location", lat, long);
}

function handleError(err) {
  console.warn(`Error(${err.code}): ${err.message}`);
}

//Graphs 

function lineGraph(data) {
  let xValuesTime = [];
  let yValuesTemp = [];

  for(let i = 0; i < data.hourly.length-24; i++){
    let time;
    let temp = data.hourly[i].temp;

     if(window.innerWidth < 980){
       if(i === 0 || i === data.hourly.length-26){
         time = moment(data.hourly[i].dt*1000).format('l');
       }
       else{
         time = moment(data.hourly[i].dt*1000).format('LT');
       }
     }
     else if(window.innerWidth >= 980){
       if(i === 0 || i === data.hourly.length-25){
         time = moment(data.hourly[i].dt*1000).format('l');
       }
       else{
         time = moment(data.hourly[i].dt*1000).format('LT');
       }
     }

    xValuesTime.push(time);
    yValuesTemp.push(temp);
  }

  let chartMin = Math.round(Math.min(...yValuesTemp) - 5);
  let chartMax = Math.round(Math.max(...yValuesTemp) + 5);

  new Chart("myChart", {
    type: "line",
    data: {
      labels: xValuesTime,
      datasets: [{
        fill: false,
        lineTension: 0,
        backgroundColor: "rgba(204, 61, 61, 0.8)",
        borderColor: "rgba(0, 0, 0,0.6)",
        data: yValuesTemp
      }]
    },
    options: {
      legend: {display: false},
      scales: {
        yAxes: [{ticks: {min: chartMin, max: chartMax}}],
      }
    }
  });
}

//Event listeners

form.addEventListener("submit", formSubmitHandler);

cityHistory.addEventListener("click", pastCitiesHandler);

myLocation.addEventListener("click", getLocation);

loadCities();

// if(window.innerWidth < 980){
    //   if(i === 0 || i === data.hourly.length-2){
    //     time = moment(data.hourly[i].dt*1000).format('lll');
    //   }
    //   else{
    //     time = moment(data.hourly[i].dt*1000).format('LTS');
    //   }
    // }
    // else if(window.innerWidth >= 980){
    //   if(i === 0 || i === data.hourly.length-1){
    //     time = moment(data.hourly[i].dt*1000).format('lll');
    //   }
    //   else{
    //     time = moment(data.hourly[i].dt*1000).format('LTS');
    //   }
    // }