module.exports = {
  auth : {
  	github: {
  		appId: 'edfc013fd01cf9d52a31',
  		appSecret: 'a9ebb79267b7d968f10e9004724a9d9ac817a8ee',
  		callbackURL : 'http://akrasia.ujo.guru:7173/auth/github/callback',
  		username : "Zeukkari"
  	},
    // FIXME: Use proper subnet checking
  	local : {
  		subnets : [ "192.168.1.0/24", "127.0.0.1/32" ]
  	}
  },
  /*
   * Device bridge
   *
   * Trigger on/off commands from remotes
   */
  bridge : {
    5 : 3,
    8 : 3,
    6 : 4,
    7 : 2
  }
};