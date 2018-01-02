function shelterDay(dayInfo) {
  var days = [ 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  return '' +
    '<div class="shelter-day>' +
      '<div class="shelter-day-dow">' + days[dayInfo.getDay()] + '</div>' +
      '<div class="shelter-day-date">' + dayInfo.getDate() + ' ' + months[dayInfo.getMonth()] + '</div>' +

    '</div>' +
  '';
}

function AppExecute(firebase) {
  function startApp() {
    alert('app started');
  }

  // Check the user state
  firebase.auth().onAuthStateChanged((user) => {
    if (!user) {
      firebase.auth().signInWithPopup(new firebase.auth.GoogleAuthProvider())
        .then(startApp);
    } else {
      startApp();
    }
  });
}

AppExecute(firebase);