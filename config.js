var process = require('process');

module.exports = {
  auth : {
    local : {
      subnets : [ "192.168.1.0/24", "127.0.0.1/32" ]
    },
    github : {
    /*
     * FIXME: Authentication mechanism is improperly implemented.
     *
     * - Username checkup seems a little strange
     * - appSecret should remain secret!
     */
      appId: 'edfc013fd01cf9d52a31',
      appSecret: process.env.TELLDUS_APP_SECRET,
      callbackURL : 'http://akrasia.ujo.guru:7173/auth/github/callback',
      username : "Zeukkari"      
    }
  },
  /*
   * Device bridge
   *
   * Trigger on/off commands from remotes
   */
  bridge : {
    5 : { "script" : "bin/alarm.sh" },
    8 : { "script" : "bin/alarm.sh"  },
    7 : { "script" : "bin/pdu.sh" },
    6 : { "bridgeTo" : 4 }
  }
}