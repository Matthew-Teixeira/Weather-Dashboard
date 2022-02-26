const form = document.querySelector("form");
const cityInputEl = document.querySelector("#city");
const currentDataContainer = document.querySelector(
  "#current-weather-container"
);
const canvas = document.querySelector("#myChart");
let letsAnimate = true;
const forecastContainer = document.querySelector("#forecast-container");
const cityHistory = document.querySelector("#search-history");
const myLocation = document.querySelector("#my-location");
let date = moment().format("MM/DD/YYYY");
let pastCities = [];

// first convert city to lat & long coordinates - returns coords as array
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

// After getting geo data, run onecall query and build current weather data section.
const getCurrentWeatherData = function (city, lat, lon) {
  fetch(
    `https://api.openweathermap.org/data/2.5/onecall?lat=${lat}&lon=${lon}&units=imperial&appid=c20b708b2952fc5492619c70affe0677`
  ).then((res) => {
    if (res.ok) {
      res.json().then((data) => {

        //temp ling graph
        lineGraph(data);

        console.log(data);

        //current weather section
        buildCurrentWeather(
          city,
          data.current.temp,
          data.current.wind_speed,
          data.current.humidity,
          data.current.uvi,
          data.current.weather[0].main,
          data.current.weather[0].description,
          data.current.weather[0].icon
        );

        //Loop through forecast - build 5-day forecast
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

// Handles city name input & updates search history
const formSubmitHandler = async function (e) {
  e.preventDefault();
  letsAnimate = false;
  const city = cityInputEl.value.trim();

  if (city) {

    //Store coords in geoData variable
    const geoData = await getGeoData(city);

    //update history, but limit history to max of 6 cities
    if(pastCities.length <= 5){
      if (pastCities.length > 0) {
        //loop through pastCities and remove duplicates
        for (let i = 0; i < pastCities.length; i++) {
          if (city === pastCities[i]) {
            pastCities.splice(i, 1);
          }
        }
      }
      pastCities.push(city);
      saveCity();
    }
    //Run api query and builds associated HTML
    getCurrentWeatherData(city, geoData[0], geoData[1]);

    form.reset();
  }
};

//Utility function
const buildEl = function (type, text) {
  let newEl = document.createElement(type);
  newEl.textContent = text;
  return newEl;
};

//Builds out curent weather section with data passed in from getCurrentWeatherData() 
const buildCurrentWeather = function (city, temp, wind, humidity, uv, type, des, icon) {
  currentDataContainer.textContent = "";

  const innerDiv = document.createElement("div");
  innerDiv.classList = "current-weather-container";
  const cityTitle = buildEl("h3", city + " " + date);
  const cityTemp = buildEl("span", "Temp: " + temp + " ℉");
  const cityWind = buildEl("span", "Wind: " + wind + " mph");
  const cityHumid = buildEl("span", "Humidity: " + humidity + "%");
  const cityUV = buildEl("span", "UV Index: " + uv);

  const infoDiv = document.createElement("div");
  infoDiv.classList = "current-info";
  const weatherType = buildEl("h3", "Condition: " + type);
  const weatherDescriptor = buildEl("p", "Type: " + des);
  const weatherIcon = document.createElement("img");
  weatherIcon.setAttribute(
    "src",
    "http://openweathermap.org/img/wn/" + icon + "@2x.png"
  );
  weatherIcon.classList = "current-weather-icon"
  infoDiv.append(weatherType, weatherDescriptor, weatherIcon);

  innerDiv.append(cityTitle, cityTemp, cityWind, cityHumid, cityUV);
  currentDataContainer.append(innerDiv, infoDiv);
};

//Builds out 5-day section with data passed in from getCurrentWeatherData() 
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

//Save city searches to local storage
function saveCity() {
  localStorage.setItem("pastCities", JSON.stringify(pastCities));
}

// Load city search history upon reload
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

// Click handler for past city buttons to query API & delete 
async function pastCitiesHandler(e) {
  e.preventDefault();
  letsAnimate = false;
  if (e.target.classList == "btn btn-secondary") {
    const city = e.target.getAttribute("data-city");

    if (city) {
      const geoData = await getGeoData(city);
      getCurrentWeatherData(city, geoData[0], geoData[1]);
    }
  }

  // Delete city option
  else if (e.target.classList == "fa-solid fa-trash-can me-3") {
    let el = e.target.parentElement;
    let deleteCity = e.target.getAttribute("data-city");
    let index = pastCities.indexOf(deleteCity);
    el.remove();
    pastCities.splice(index, 1);
    saveCity();
  }
}

// Find user location and query API
function getLocation() {
  letsAnimate = false;
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(showPosition, handleError);
  } else {
    alert("Geolocation is not supported by this browser.");
  }
}

function showPosition(position) {
  letsAnimate = false;
  const lat = position.coords.latitude;
  const long = position.coords.longitude;
  getCurrentWeatherData("Weather Near Me", lat, long);
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
        backgroundColor: "rgba(102, 209, 252, .8)",
        borderColor: "rgba(0, 0, 0,0.6)",
        data: yValuesTemp,
      }]
    },
    options: {
      legend: {display: false},
      scales: {
        yAxes: [{ticks: {min: chartMin, max: chartMax}}]
      }
    }
  });
}

//Canvas Clouds --
const ctx = canvas.getContext('2d');
ctx.canvas.width = window.innerWidth;
ctx.canvas.height = window.innerHeight/2;

let particleArray = [];
const colors = [
  'white',
  'rgba(255, 255, 255, 0.3)',
  'rgba(173, 216, 230, 0.8)',
  'rgba(211, 211, 211, 0.8)'
]
const maxSize = 40;
const minSize = 0;
const mouseRadius = 60;

// mouse position
let mouse = {
  x: null,
  y: null
}

window.addEventListener('mousemove',
  function(event) {
    mouse.x = event.x;
    mouse.y = event.y/2.2;
  }
)

// constructor function for particles
function Particle(x, y, directionX, directionY, size, color){
  this.x = x;
  this.y = y;
  this.directionX = directionX;
  this.directionY = directionY;
  this.size = size;
  this.color = color;
}
//Draw particles method as proto
Particle.prototype.draw = function() {
  ctx.beginPath();
  ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2, false);
  ctx.fillStyle = this.color;
  ctx.fill();
}

//add update method to particle proto
Particle.prototype.update = function() {
  if(this.x + this.size*2 > canvas.width ||
      this.x - this.size*2 < 0){
        this.directionX = -this.directionX;
    }
    if(this.y + this.size*2 > canvas.height ||
      this.y - this.size*2 < 0){
        this.directionY = -this.directionY;
    }
    this.x += this.directionX;
    this.y += this.directionY;

    // Mouse interactivity
    if( mouse.x - this.x < mouseRadius 
        && mouse.x - this.x > -mouseRadius 
        && mouse.y - this.y < mouseRadius
        && mouse.y - this.y > -mouseRadius) {
        if (this.size < maxSize){
          this.size += 3;
        }
      } else if( this.size > minSize){
        this.size -= 0.1;
      }
      if(this.size < 0) {
        this.size = 0;
      }
      this.draw();
}

//create particle array
function init() {
  particleArray = [];
  for(let i = 0; i < 1000; i++){
    let size = 0;
    let x = (Math.random() * ((innerWidth - size * 2) - (size * 2)) + size * 2);
    let y = (Math.random() * ((innerHeight - size * 2) - (size * 2)) + size * 2);
    let directionX = (Math.random()* 0.2) - 0.1;
    let directionY = (Math.random()* 0.2) - 0.1
    let color = colors[Math.floor(Math.random() * colors.length)];

    particleArray.push(new Particle(x, y, directionX, directionY, size, color));
  }
}

//Animation loop 
function animate() {
  if(letsAnimate){
    requestAnimationFrame(animate);
  ctx.clearRect(0, 0, innerWidth, innerHeight);

  for(let i = 0; i < particleArray.length; i++){
    particleArray[i].update();
  }
  }
}

  init();
  animate();


//Canvas Clouds --

//Event listeners

form.addEventListener("submit", formSubmitHandler);

cityHistory.addEventListener("click", pastCitiesHandler);

myLocation.addEventListener("click", getLocation);

loadCities();