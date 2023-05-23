const timeAttraction = attractionTime;
const time = dayjs().format('HHmm');

console.log(time);

function timeSplit() {
  const digits = time.toString().split('');
  const realTime = digits.map(Number);
  const x = realTime.slice(0, 2);
  const hour = x.join('');
  const y = realTime.slice(2, 4);
  const minute = y.join('');
  const timeSort = +hour * 60 + +minute; //current time in total number of minutes
  console.log('The open min: ', timeSort);
  return timeSort;
}
function checkOpening() {
  for (let attractions of timeAttraction) {
    const timeToOpen = attractions.opening_time;
    const digits = timeToOpen.split('');
    const openNum = digits.map(Number);
    const x = openNum.slice(0, 2);
    const hour = x.join('');
    const y = openNum.slice(2, 4);
    const minute = y.join('');
    const openingHour = +hour * 60 + +minute;
    //const timeHour = timeSplit();
    //const openingNow = openingHour - timeHour;
    //const openNow = attractions.place;
    return openingHour;
  }
  console.log('Open:', openingHour);
}
function checkClosing() {
  for (let attractions of timeAttraction) {
    const timeToClose = attractions.closing_time;
    const digits = timeToClose.toString().split('');
    const closeNum = digits.map(Number);
    const x = closeNum.slice(0, 2);
    const hour = x.join('');
    const y = closeNum.slice(2, 4);
    const minute = y.join('');
    const closeHour = +hour * 60 + +minute;
    const timeHour = timeSplit();
    const closingNow = closeHour - timeHour;
    //const openHour = checkOpening();

    const closeNow = attractions.place;
    const closedHour = attractions.closing_time;
    const openedHour = attractions.opening_time;
    //const openNow = checkOpening();
    //const closedNow = attractions.place;

    let h = Math.floor(closingNow / 60);
    let m = closingNow % 60;

    const beforeOpening = dayjs().isBefore(closedHour, 'day'); //true fasle is it before opening time?
    const afterClosed = dayjs().isAfter(openedHour, 'day'); //true/false is it after closing time?

    console.log('?:', afterClosed);
    console.log('Clock:', timeHour);
    if (beforeOpening === false && afterClosed === false) {
      document.getElementById('closed').style.visibility = 'hidden';
      document.getElementById('nowClosed').innerHTML = `${attractions.place}`;
      document.getElementById('open').style.visibility = 'visible';
    } else if (Math.round(closeHour - timeHour) >= 200) {
      document.getElementById('closingHr').innerHTML = h + ' hours';
      document.getElementById('closingMin').innerHTML = m + ' min';
      document.getElementById('closingPlace').innerHTML = closeNow;
      document.getElementById('open').style.visibility = 'hidden';
      document.getElementById('closed').style.visibility = 'visible';
      console.log(
        `${attractions.place} closing time is ${timeToClose} which is in ${h} hrs and ${m} min. `
      );
    } else if (
      Math.round(closeHour - timeHour) >= 99 &&
      Math.round(closeHour - timeHour) <= 199
    ) {
      document.getElementById('closingHr').innerHTML = h + ' hour';
      document.getElementById('closingMin').innerHTML = m + ' min';
      document.getElementById('closingPlace').innerHTML = closeNow;
      document.getElementById('open').style.visibility = 'hidden';
      document.getElementById('closed').style.visibility = 'visible';
      console.log(
        `${attractions.place} closing time is ${timeToClose} which is in ${h} hr and ${m} min. `
      );
    } else if (
      Math.round(closeHour - timeHour) >= 1 &&
      Math.round(closeHour - timeHour) <= 100
    ) {
      document.getElementById('closingMin').innerHTML = m + ' min';
      document.getElementById('closingPlace').innerHTML = closeNow;
      document.getElementById('closed').style.visibility = 'visible';
      document.getElementById('open').style.visibility = 'hidden';
      console.log(
        `${attractions.place} closing time is ${timeToClose} which is in ${m} min. `
      );
    } else if (Math.round(closeHour - timeHour) <= 0) {
      document.getElementById('closed').style.visibility = 'hidden';
      document.getElementById('nowClosed').innerHTML = `${attractions.place}`;
      document.getElementById('open').style.visibility = 'visible';
      console.log(`${attractions.place} is now closed for the day`);
    }
  }
}

checkClosing();
