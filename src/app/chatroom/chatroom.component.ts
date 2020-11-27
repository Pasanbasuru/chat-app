import {
  Component,
  OnInit,
  ElementRef,
  ViewChild,
  Injectable,
} from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import {
  FormControl,
  FormGroupDirective,
  FormBuilder,
  FormGroup,
  NgForm,
  Validators,
} from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material/core';
import * as firebase from 'firebase';
import { DatePipe } from '@angular/common';
import { HttpClient, HttpParams, HttpXhrBackend } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { AppInjector } from '../app.module';

export class MyErrorStateMatcher implements ErrorStateMatcher {
  isErrorState(
    control: FormControl | null,
    form: FormGroupDirective | NgForm | null
  ): boolean {
    const isSubmitted = form && form.submitted;
    return !!(
      control &&
      control.invalid &&
      (control.dirty || control.touched || isSubmitted)
    );
  }
}

export const snapshotToArray = (snapshot: any, counter: number) => {
  const returnArr = [];

  snapshot.forEach((childSnapshot: any) => {
    const item = childSnapshot.val();
    item.key = childSnapshot.key;
    returnArr.push(item);
  });

  if (counter > 0) {
    const httpClient = new HttpClient(
      new HttpXhrBackend({ build: () => new XMLHttpRequest() })
    );
    const toastr = AppInjector.get(ToastrService);
    const text = returnArr[returnArr.length - 1].message;
    httpClient
      .get('whispering-stream-75761.herokuapp.com/api/hte', {
        params: new HttpParams().set('text', text),
      })
      .subscribe((data: any) => {
        toastr.info(data.data, '', { disableTimeOut: true , closeButton: true, progressBar: true, positionClass: 'toast-center-center'});
      });
  }
  return returnArr;
};

@Component({
  selector: 'app-chatroom',
  templateUrl: './chatroom.component.html',
  styleUrls: ['./chatroom.component.css'],
})
export class ChatroomComponent implements OnInit {
  @ViewChild('chatcontent') chatcontent: ElementRef;
  scrolltop: number = null;

  chatForm: FormGroup;
  nickname = '';
  roomname = '';
  message = '';
  users = [];
  chats = [];
  matcher = new MyErrorStateMatcher();
  counter = 0;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private formBuilder: FormBuilder,
    public datepipe: DatePipe,
    private http: HttpClient
  ) {
    this.nickname = localStorage.getItem('nickname');
    this.roomname = this.route.snapshot.params.roomname;
    firebase
      .database()
      .ref('chats/')
      .on('value', (resp) => {
        this.chats = [];

        this.chats = snapshotToArray(resp, this.counter);
        this.counter += 1;

        setTimeout(
          () => (this.scrolltop = this.chatcontent.nativeElement.scrollHeight),
          500
        );
      });
    firebase
      .database()
      .ref('roomusers/')
      .orderByChild('roomname')
      .equalTo(this.roomname)
      .on('value', (resp2: any) => {
        const roomusers = snapshotToArray(resp2, 0);
        this.users = roomusers.filter((x) => x.status === 'online');
      });
  }
  ngOnInit(): void {
    this.chatForm = this.formBuilder.group({
      message: [null, Validators.required],
    });
  }

  public translate(text: string): Observable<any> {
    return this.http.get('http://localhost:3000/api/eth', {
      params: new HttpParams().set('text', text),
    });
  }

  onFormSubmit(form: any) {
    this.counter = 0;
    const chat = form;
    chat.roomname = this.roomname;
    chat.nickname = this.nickname;
    chat.date = this.datepipe.transform(new Date(), 'dd/MM/yyyy HH:mm:ss');
    chat.type = 'message';
    const newMessage = firebase.database().ref('chats/').push();

    this.translate(chat.message).subscribe((data: any) => {
      chat.message = data.data;
      newMessage.set(chat);
    });

    this.chatForm = this.formBuilder.group({
      message: [null, Validators.required],
    });
  }

  exitChat() {
    const chat = {
      roomname: '',
      nickname: '',
      message: '',
      date: '',
      type: '',
    };
    chat.roomname = this.roomname;
    chat.nickname = this.nickname;
    chat.date = this.datepipe.transform(new Date(), 'dd/MM/yyyy HH:mm:ss');
    chat.message = `${this.nickname} leave the room`;
    chat.type = 'exit';
    const newMessage = firebase.database().ref('chats/').push();
    newMessage.set(chat);

    firebase
      .database()
      .ref('roomusers/')
      .orderByChild('roomname')
      .equalTo(this.roomname)
      .on('value', (resp: any) => {
        let roomuser = [];
        roomuser = snapshotToArray(resp, 0);
        const user = roomuser.find((x) => x.nickname === this.nickname);
        if (user !== undefined) {
          const userRef = firebase.database().ref('roomusers/' + user.key);
          userRef.update({ status: 'offline' });
        }
      });

    this.router.navigate(['/roomlist']);
  }
}
