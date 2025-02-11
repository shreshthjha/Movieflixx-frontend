import { HttpClient } from '@angular/common/http';
import { Injectable, signal, WritableSignal } from '@angular/core';
import { jwtDecode } from 'jwt-decode';
import { catchError, Observable, tap, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  public  readonly BASE_URL = "http://localhost:8080";

  //for state management in angular we use signal
  private loggedIn = signal<boolean>(this.isAuthenticated());

  constructor(private http : HttpClient) { }

  register(registerRequest: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.BASE_URL}/api/v1/auth/register`, registerRequest, {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  login(loginRequest : LoginRequest): Observable<AuthResponse>{
    return this.http.post<AuthResponse>(`${this.BASE_URL}/api/v1/auth/login`, loginRequest)
    .pipe( tap( response => {
      if(response && response.accessToken){
        sessionStorage.setItem('accessToken', response.accessToken);
        sessionStorage.setItem('refreshToken', response.refreshToken);
        sessionStorage.setItem('name', response.name);
        sessionStorage.setItem('username', response.username);
        sessionStorage.setItem('email', response.email);

        const decodedToken: any = jwtDecode(response.accessToken);
        sessionStorage.setItem('role', decodedToken.role[0]);
      }
  }));
  }
  
  isAuthenticated() : boolean {
    const token = sessionStorage.getItem('accessToken');
    // return !!sessionStorage.getItem('accessToken') && !this.isTokenExpired()
    return token != null && !this.isTokenExpired(token);
  }

  logout(): void {
    sessionStorage.removeItem('accessToken');
        sessionStorage.removeItem('refreshToken');
        sessionStorage.removeItem('name');
        sessionStorage.removeItem('username');
        sessionStorage.removeItem('email');
  }

  setLoggedIn(value : boolean) {
    this.loggedIn.set(value);
  }

  getLoggedIn() : WritableSignal<boolean>{
    return this.loggedIn;
  }

  isTokenExpired(token : string): boolean {
      const decodedToken : any = jwtDecode(token);
      return (decodedToken.exp * 1000) < Date.now();
  }

  refreshToken(): Observable<any>{
    const refToken = sessionStorage.getItem('refreshToken');
    const refobj: refreshTokenRequest = {
      refreshToken: refToken 
    }
    return this.http.post(`${this.BASE_URL}/api/v1/auth/refresh`,{refobj}).pipe(
      tap((res : any ) => sessionStorage.setItem('accessToken', res.accessToken)),
      catchError(err => {
        this.logout();
        return throwError(() => err);
      })
    )
  }

  //logic to check a particular given role
  hasRole(role: string): boolean {
    const token = sessionStorage.getItem('accessToken');
    if(token){
      const decodedToken: any = jwtDecode(token);
      return decodedToken?.role[0].includes(role);
    }
    return false;
  }
  
}

export type LoginRequest = {
  email : string,
  password : string,
}

export type RegisterRequest = {
  name : string,
  email : string,
  username : string,
  password : string,
}

export type AuthResponse = {
  accessToken : string,
  refreshToken : string,
  name : string,
  email : string,
  username : string,
}

export type refreshTokenRequest ={
  refreshToken: string | null,
}