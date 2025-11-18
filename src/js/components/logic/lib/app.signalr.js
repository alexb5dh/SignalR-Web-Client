import * as SignalR from "@microsoft/signalr";
import { MessagePackHubProtocol } from "@microsoft/signalr-protocol-msgpack";
import { AppEvents } from './app.common';

class SignalRApp {
    constructor(url) {
        this.url = url;
        this.connection = null;
        this.isConnected = false;
        this.processResponse = null;
    }

    Init(options) {
        this.options = options;

        var confguration = {};
        if(options.isTokenRequired === true) {
            console.log(options.authMethod);
            if (options.authMethod === 'header') {
                confguration.headers = {
                    "Authorization": `Bearer ${options.getToken()}`
                };
            } else if (options.authMethod === 'method') {
                // For method auth, we'll call Authenticate after connection
                this.token = options.getToken();
            } else if (options.authMethod === 'query') {
                confguration.accessTokenFactory = () => options.getToken();
            } else {
                // For token auth, we'll fetch token from the endpoint
                const hubUrl = new URL(options.url);
                const tokenEndpoint = `${hubUrl.origin}/connection/token`;

                confguration.accessTokenFactory = async () => {
                    try {
                        const response = await fetch(tokenEndpoint, {
                            method: 'GET',
                            headers: {
                                'Authorization': `Bearer ${options.getToken()}`
                            }
                        });

                        if (!response.ok) {
                            throw new Error(`Token endpoint returned ${response.status}: ${response.statusText}`);
                        }

                        const data = await response.json();
                        if (!data.token) {
                            throw new Error('Token endpoint response does not contain token');
                        }

                        return data.token;
                    } catch (error) {
                        AppEvents.emit('Logger', `Failed to fetch token: ${error.message}`);
                        throw error;
                    }
                };
            }
        }

        switch(options.transportType) {
            case "ws":
                confguration.transport = SignalR.HttpTransportType.WebSockets;
              break;
            case "lp":
                confguration.transport = SignalR.HttpTransportType.LongPolling;
              break;
              case "sse":
                confguration.transport = SignalR.HttpTransportType.ServerSentEvents;
                break;
            default:
                confguration.transport = SignalR.HttpTransportType.WebSockets;
        }

        //confguration.logMessageContent = true;
        if(!!options.skipNegotiation) {
            confguration.skipNegotiation = options.skipNegotiation;
        }
                
        let builder = new SignalR.HubConnectionBuilder()
            .withUrl(options.url, confguration)
            .configureLogging(SignalR.LogLevel.Information)
            .withAutomaticReconnect([0, 3000, 5000, ...Array(30).fill(10000)]);


        if (options.serializationType === 'messagepack') {
            console.log('Using MessagePack protocol');
            builder = builder.withHubProtocol(new MessagePackHubProtocol());
        }

        this.connection = builder.build();

        var self = this;
        self.processResponse = self.connection.processIncomingData;

        self.connection.processIncomingData = function (data) {
            self.processResponse.call(self.connection, data);
            self.HandleResponse(data);
        }

        self.connection.onreconnecting((error) => {
            AppEvents.emit('Logger', `Connection lost due to error "${error}". Reconnecting.`);
            console.log('On Reconnecting...');
        });

        self.connection.onreconnected((connectionId) => {
            AppEvents.emit('Logger', `Reconnected successfully`);
            console.log('On Reconnected...');
            if (options.isTokenRequired && options.authMethod === 'method') {
                self.connection.invoke("Authenticate", self.token)
                    .catch(err => {
                        AppEvents.emit('Logger', `Authentication failed after reconnection: ${err}`);
                    });
            }
        });
    }
    
    
    OnConnect(onSuccess, onError) {
        var self = this;
        self.connection.start()
            .then(function (data) {
                if (self.options.isTokenRequired && self.options.authMethod === 'method') {
                    return self.connection.invoke("Authenticate", self.token)
                        .then(() => {
                            onSuccess({ url: self.url });
                        });
                }
                onSuccess({ url: self.url });
            })
            .catch(function (err) {
                onError(err)
            });
    }
    
    OnSend(options, beforeInvoke, onError) {
        var methodArguments = new Array();
        methodArguments = options.methodArguments;
    
        beforeInvoke(options);
        this.connection.invoke(options.methodName, ...methodArguments)
            .catch(function (err) {
                onError(err);
            });
    }
    
    OnReceive(callback) {
    }
    
    OnDisconnect(onSuccess, onError) {
        this.connection.stop()
            .then(function () {
                onSuccess();
            })
            .catch(function (err) {
                onError(err);
            });
    }

    HandleResponse(input) {
        AppEvents.emit('Logger', input.toString());
        var output = this.ParseRespose(input);
        if(output !== null) {
            
            output.forEach((e) => {
                var jsonObj = JSON.parse(e);

                if(jsonObj !== null && jsonObj.hasOwnProperty('target')) {
                    AppEvents.emit('ReceivedData', { "ClientMethod": jsonObj.target, "Data": jsonObj.arguments });
                }
            });
        }
    }

    ParseRespose(input) {

        if (typeof input !== "string") {
            console.log("Invalid input for JSON hub protocol. Expected a string.");
            return null; 
            //throw new Error("Invalid input for JSON hub protocol. Expected a string.");
        }

        var separator = String.fromCharCode(0x1e);
        if (input[input.length - 1] !== separator) {
            console.log("Message is incomplete.");
            //throw new Error("Message is incomplete.");
            return null; 
        }

        var messages = input.split(separator);
        messages.pop();
        return messages;
    }
}

export { SignalRApp }