import * as appSignalR from './lib/app.signalr';

var sr = null;
class AppLogic {

    constructor() {
        this.isTokenRequired = false;
        this.authMethod = 'none';
        this.isBasicView = true;
    }

    Init(options) {
        if(this.isBasicView !== true && this.isTokenRequired === true) {
            options["isTokenRequired"] = true;
            options["authMethod"] = this.authMethod;
        } 
        else {
            options["isTokenRequired"] = false;
            options["authMethod"] = 'none';
        }
        
        sr = new appSignalR.SignalRApp(options.url);
        sr.Init(options);        
    }
    
    OnConnect(onSuccess, onError) {
        sr.OnConnect(onSuccess, onError);
    }
    
    OnSend(options, beforeInvoke, onError) {
        sr.OnSend(options, beforeInvoke, onError);
    }
    
    OnReceive(callback) { 
        sr.OnReceive(callback);
    }
    
    OnDisconnect(onSuccess, onError) { 
        sr.OnDisconnect(onSuccess, onError);
    }

    EnableAuth(method) {
        this.isTokenRequired = true;
        this.authMethod = method;
    }

    DisableAuth() {
        this.isTokenRequired = false;
        this.authMethod = 'none';
    }

    IsAuthEnabled() {
        return this.isTokenRequired;
    }

    GetCurrentView() {
        return this.isBasicView;
    }

    SetCurrentViewAsBasic() {
        this.isBasicView = true;
    }

    SetCurrentViewAsAdvance() {
        this.isBasicView = false;
    }
}

export { AppLogic }