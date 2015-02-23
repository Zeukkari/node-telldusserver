-----------------------------------------------------
-- Define your variables here
-----------------------------------------------------

local tid = -1;
local counter = 0;

local http = libs.http;

-----------------------------------------------------
-- Implement your actions here, if needed:
-----------------------------------------------------

actions.turnOn = function ()
	layout.message.text = "Let there be light!";
	local resp = http.get("http://192.168.1.104:8085/aamuvalo");
end

actions.turnOff = function ()
	layout.message.text = "Darkness shall rule!";
	local resp = http.get("http://192.168.1.104:8085/pimeys");
end

actions.telldus2On = function ()
	layout.message.text = "Telldus on";

	local headers = { ["Cache-Control"] = "no-cache" };	

	local req = { method = "post",
	              url = "http://192.168.1.104:8075/api/1",
	              mime = "application/x-www-form-urlencoded",
	              headers = headers,
	              content = "cmd=turnOn" };

	local resp = http.request(req);
end

actions.telldus2Off = function ()
	layout.message.text = "Telldus off";

	local headers = { ["Cache-Control"] = "no-cache" };	

	local req = { method = "post",
	              url = "http://192.168.1.104:8075/api/1",
	              mime = "application/x-www-form-urlencoded",
	              headers = headers,
	              content = "cmd=turnOff" };

	local resp = http.request(req);

end


actions.telldus2On = function ()
	layout.message.text = "Telldus on";

	local headers = { ["Cache-Control"] = "no-cache" };	

	local req = { method = "post",
	              url = "http://192.168.1.104:8075/api/2",
	              mime = "application/x-www-form-urlencoded",
	              headers = headers,
	              content = "cmd=turnOn" };

	local resp = http.request(req);
end

actions.telldus2Off = function ()
	layout.message.text = "Telldus off";

	local headers = { ["Cache-Control"] = "no-cache" };	

	local req = { method = "post",
	              url = "http://192.168.1.104:8075/api/2",
	              mime = "application/x-www-form-urlencoded",
	              headers = headers,
	              content = "cmd=turnOff" };

	local resp = http.request(req);

end

actions.telldus3On = function ()
	layout.message.text = "Telldus on";

	local headers = { ["Cache-Control"] = "no-cache" };	

	local req = { method = "post",
	              url = "http://192.168.1.104:8075/api/3",
	              mime = "application/x-www-form-urlencoded",
	              headers = headers,
	              content = "cmd=turnOn" };

	local resp = http.request(req);
end

actions.telldus3Off = function ()
	layout.message.text = "Telldus off";

	local headers = { ["Cache-Control"] = "no-cache" };	

	local req = { method = "post",
	              url = "http://192.168.1.104:8075/api/3",
	              mime = "application/x-www-form-urlencoded",
	              headers = headers,
	              content = "cmd=turnOff" };

	local resp = http.request(req);

end

actions.lights = function ()
	layout.message.text = "Telldus on";

	local headers = { ["Cache-Control"] = "no-cache" };	

	local req = { method = "post",
	              url = "http://192.168.1.104:8075/api/4",
	              mime = "application/x-www-form-urlencoded",
	              headers = headers,
	              content = "cmd=turnOn" };

	local resp = http.request(req);
end

actions.darkness = function ()
	layout.message.text = "Telldus off";

	local headers = { ["Cache-Control"] = "no-cache" };	

	local req = { method = "post",
	              url = "http://192.168.1.104:8075/api/4",
	              mime = "application/x-www-form-urlencoded",
	              headers = headers,
	              content = "cmd=turnOff" };

	local resp = http.request(req);

end

actions.update = function (progress)
  print("progress was changed to " .. progress);

  local content;

  if progress == 0 then
  	content = "cmd=turnOff";
	else 
		content = "cmd=dim&dimLevel=" .. progress;
	end


	local headers = { ["Cache-Control"] = "no-cache" };

	local req = { method = "post",
	              url = "http://192.168.1.104:8075/api/4",
	              mime = "application/x-www-form-urlencoded",
	              headers = headers,
	              content = content };

	local resp = http.request(req);

end