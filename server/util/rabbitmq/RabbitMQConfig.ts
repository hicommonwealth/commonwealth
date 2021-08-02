import { RABBITMQ_URI, RABBITMQ_VHOST, HANDLE_IDENTITY } from '../../config';

let config;

if (HANDLE_IDENTITY == 'publish')
  config = {
    "vhosts": {
      [RABBITMQ_VHOST]: {
        'connection': RABBITMQ_URI,
        "exchanges": {
          "eventsExchange": {
            "assert": true
          }
        },
        "queues": {
          "eventsQueue": {
            "assert": true
          },
          "identityQueue": {
            "assert": true
          }
        },
        "bindings": {
          "eventsBinding": {
            "source": "eventsExchange",
            "destination": "eventsQueue",
            "destinationType": "queue",
            "bindingKey": "eQueue"
          },
          "identityBinding": {
            "source": "eventsExchange",
            "destination": "identityQueue",
            "destinationType": "queue",
            "bindingKey": "iQueue"
          }
        },
        "publications": {
          "eventsPub": {
            "vhost": "/",
            "queue": "eventsQueue",
            "confirm": true,
            "timeout": 10000
          },
          "identityPub": {
            "vhost": "/",
            "queue": "identityQueue",
            "confirm": true,
            "timeout": 10000
          }
        },
        "subscriptions": {
          "eventsSub": {
            "vhost": "/",
            "queue": "eventsQueue",
            "contentType": "application/json"
          },
          "identitySub": {
            "vhost": "/",
            "queue": "identityQueue",
            "contentType": "application/json"
          }
        }
      }
    }
  }
else if (!HANDLE_IDENTITY || HANDLE_IDENTITY === 'handle') {
  config = {
    "vhosts": {
      [RABBITMQ_VHOST]: {
        'connection': RABBITMQ_URI,
        "exchanges": {
          "eventsExchange": {
            "assert": true
          }
        },
        "queues": {
          "eventsQueue": {
            "assert": true
          }
        },
        "bindings": {
          "eventsBinding": {
            "source": "eventsExchange",
            "destination": "eventsQueue",
            "destinationType": "queue",
            "bindingKey": "eQueue"
          }
        },
        "publications": {
          "eventsPub": {
            "vhost": "/",
            "queue": "eventsQueue",
            "confirm": true,
            "timeout": 10000
          }
        },
        "subscriptions": {
          "eventsSub": {
            "vhost": "/",
            "queue":"eventsQueue",
            "contentType": "application/json"
          }
        }
      }
    }
  }
}

export default config
