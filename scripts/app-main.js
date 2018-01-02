function shelterDay(d) {
  var days = [ 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var p = d.period || {};

  return '' +
    '<div class="sd" data-id="' + d.id + '">' +
      '<div class="sd-header">' +
        '<div class="sd-dow">' + days[p.getDay()] + '</div>' +
        '<div class="sd-date">' + months[p.getMonth()] + ' ' + p.getDate() + '</div>' +
        '<div class="sd-status">' + (d.open ? 'OPEN' : 'CLOSED') + '</div>' +
      '</div>' +
      '<div class="sd-staffing">' +
        '<div class="sd-breakfast">Breakfast: ' + showName(d.brk) || sButton('brk', d.id) + '</div>' +
        '<div class="sd-ev-lead">Evening Lead: ' + showName(d.evLead) || sButton('evLead', d.id) + '</div>' +
        '<div class="sd-ev-second">Evening Second: ' + showName(d.evSecond) || sButton('evSecond', d.id) + '</div>' +
        '<div class="sd-ov-lead">Overnight Lead: ' + showName(d.ovLead) || sButton('ovLead', d.id) + '</div>' +
        '<div class="sd-ov-second">Overnight Second: ' + showName(d.ovSecond) || sButton('ovSecond', d.id) + '</div>' +
      '</div>' +
    '</div>' +
  '';
}

function sButton(type, id) {
  return '<button data-id= "' + id + '" class="sign-up" data-type="' + type + '">Sign Up</button>';
}


function AppExecute(firebase) {
  // Initialize vars
  var admins = ['xLpwSqQqSfdWcBZDhhymNmp4qZD2'];
  var scheduleDays = firebase.database().ref('/scheduleDays/');
  var isAdmin;




  function showDays(dayz) {
    var markup = '';

    dayz.forEach(function (sDay) {
      var d = sDay.exportVal();

      markup += d && shelterDay(d);
    });

    markup += isAdmin ?
      '<button id="add-days">OPEN MORE DAYS</button>' : '';

    document.getElementById('scheduler').innerHTML = markup;

    document.getElementById('add-days').addEventListener('click', addMoreDays);
  }

  function addMoreDays(evt) {
    var addDaysForm = document.createElement('form');

    addDaysForm.innerHTML = '' +
      '<label>Date or Date Range</label><input type="text"><button id="create-days">ADD</button>' +
    '';

    evt.currentTarget.insertAdjacentElement('beforebegin', addDaysForm);
  }

  function startApp() {
    isAdmin = firebase.auth().currentUser && admins.indexOf(firebase.auth().currentUser.uid) > -1;

    scheduleDays.on('value', showDays);
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