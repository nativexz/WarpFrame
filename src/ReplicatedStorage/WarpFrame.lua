local assets = game:GetService("AssetService")
local reps = game:GetService("ReplicatedStorage")
local ev = reps.Events

local b64c='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
local function dec(data) data=string.gsub(data,'[^'..b64c..'=]','') return(data:gsub('.',function(x)if(x=='=')then return''end local r,f='',(b64c:find(x)-1)for i=6,1,-1 do r=r..(f%2^i-f%2^(i-1)>0 and'1'or'0')end return r end):gsub('%d%d%d?%d?%d?%d?%d?%d?',function(x)if(#x~=8)then return''end local c=0;for i=1,8 do c=c+(x:sub(i,i)=='1'and 2^(8-i)or 0)end return string.char(c)end)) end

local warpframe = {}
warpframe.__index = warpframe

function warpframe.new(img_label)
	local self = setmetatable({}, warpframe)
	self.img = img_label; self.current_sid = nil
	return self
end

function warpframe:request(opts)
	self.current_sid = nil; task.wait()
	self.img.Image = ""
	local session = ev.InitImg:InvokeServer(opts)
	if not session or not session.sid then return warn("init failed") end
	self.current_sid = session.sid
	local img = assets:CreateEditableImage({Size = Vector2.new(session.w, session.h)})
	self.img.Size = UDim2.fromOffset(session.w, session.h)
	self.img.ImageContent = Content.fromObject(img)
	if session.type == "gif" then
		task.spawn(self._animate_gif, self, session, img)
	else
		task.spawn(self._draw_static, self, session, img)
	end
end

function warpframe:_draw_static(sess, img)
	for i = 0, sess.total - 1 do
		if self.current_sid ~= sess.sid then break end
		local chunk_data, retries = ev.GetData:InvokeServer(sess.sid, i), 0
		while not chunk_data and retries < 3 do retries=retries+1; task.wait(0.5); chunk_data = ev.GetData:InvokeServer(sess.sid, i) end
		if chunk_data and chunk_data[1] then
			local chunk = chunk_data[1]
			img:WritePixelsBuffer(Vector2.new(chunk.x, chunk.y), Vector2.new(chunk.w, chunk.h), buffer.fromstring(dec(chunk.b64)))
		else warn("failed to get chunk " .. i) end
		task.wait()
	end
end

function warpframe:_animate_gif(sess, img)
	local all_frames = table.create(sess.total)
	local batch_size = 10
	for i = 0, sess.total - 1, batch_size do
		if self.current_sid ~= sess.sid then return end
		local frame_batch = ev.GetData:InvokeServer(sess.sid, i, batch_size)
		if frame_batch then
			for j, frame_data in ipairs(frame_batch) do
				task.spawn(function()
					all_frames[i + j] = buffer.fromstring(dec(frame_data.b64))
				end)
				if j % 5 == 0 then
					task.wait()
				end
			end
		else
			warn("failed to get frame batch starting at " .. i)
		end
		task.wait()
	end
	
	while #all_frames < sess.total do
		if self.current_sid ~= sess.sid then return end
		task.wait(0.1)
	end

	while self.current_sid == sess.sid do
		for i, frame_buf in ipairs(all_frames) do
			if self.current_sid ~= sess.sid then break end
			if frame_buf then
				img:WritePixelsBuffer(Vector2.zero, img.Size, frame_buf)
			end
			local delay = sess.delays[i]
			task.wait(delay / 100)
		end
	end
end

return warpframe
