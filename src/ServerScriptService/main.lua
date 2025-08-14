local https = game:GetService("HttpService")
local reps = game:GetService("ReplicatedStorage")
local ev = reps.Events

local base_url = "http://localhost:3000"

ev.InitImg.OnServerInvoke = function(plr, opts)
	local payload = https:JSONEncode(opts or {})
	local ok, res = pcall(function() return https:PostAsync(base_url .. "/init", payload, Enum.HttpContentType.ApplicationJson) end)
	return (ok and https:JSONDecode(res)) or nil
end

ev.GetData.OnServerInvoke = function(plr, sid, i, c)
	local payload = https:JSONEncode({sid = sid, i = i, c = c})
	local ok, res = pcall(function() return https:PostAsync(base_url .. "/data", payload, Enum.HttpContentType.ApplicationJson) end)
	return (ok and https:JSONDecode(res)) or nil
end
