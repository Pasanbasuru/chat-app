import { Component } from '@angular/core';
import * as firebase from 'firebase';

const config = {
  apiKey: '',
  databaseURL: 'https://chat-59e90.firebaseio.com'
};

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'angular-chat';

  constructor() {
    firebase.initializeApp(config);
  }
}
