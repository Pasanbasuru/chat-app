import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class TranslateService {
  constructor(private http: HttpClient) {}

  public translateEnglish(text: string): Observable<any> {
    return this.http.get('http://tungsten-closed-monitor.glitch.me/api/eth', {
      params: new HttpParams().set('text', text),
    });
  }
  public translateHindi(text: string): Observable<any> {
    return this.http.get('http://tungsten-closed-monitor.glitch.me/api/hte', {
      params: new HttpParams().set('text', text),
    });
  }
}
