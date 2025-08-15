
-- i fucked up with that gif... nigga i didn't known that's gonna be hard... but nvm
-- so i little minified that btw, on future i will optimizate that because with gifs probelms...
-- abt the base64_dec it's every time error "SCRIPT HAS BEEN TIMEOUT DDOS YOUR ASS"...

local hs = game:GetService("HttpService")
local as = game:GetService("AssetService")
local rs = game:GetService("ReplicatedStorage")
local ev = rs:WaitForChild("Events")

local function b2s(d)
	local t = d.bytes or d
	if not t then return "" end
	local c = {}
	for i = 1, #t do c[i] = string.char(t[i]) end
	return table.concat(c)
end

local R = {}
R.__index = R

function R.new(lbl)
	local self = setmetatable({}, R)
	self.lbl = lbl
	self.sid = nil
	return self
end

function R:rq(o)
	self.sid = nil
	task.wait()
	self.lbl.Image = ""
	local s = ev.InitImg:InvokeServer(o or {})
	if not s or not s.sid then return end
	self.sid = s.sid

	local e = as:CreateEditableImage({ Size = Vector2.new(s.w, s.h) })
	self.lbl.Size = UDim2.fromOffset(s.w, s.h)
	self.lbl.ImageContent = Content.fromObject(e)

	if s.type == "gif" then
		task.spawn(self._ani, self, s, e)
	else
		task.spawn(self._dst, self, s, e)
	end
end

function R:_dst(s, e)
	for i = 0, s.total - 1 do
		if self.sid ~= s.sid then return end
		local r = ev.GetData:InvokeServer(s.sid, i)
		local ch = r.chunks or r
		for _, c in ipairs(ch) do
			local str = b2s(c)
			local buf = buffer.fromstring(str)
			e:WritePixelsBuffer(Vector2.new(c.x, c.y),Vector2.new(c.w, c.h),buf)
		end
		task.wait()
	end
end

function R:_ani(s, e)
	local F, bs = {}, 10
	local speedMul = 1.02^100 --math :genius: DONT USE MATH.FLOOR PLEASE... or you fuck up.

	-- preload frames
	for i = 0, s.total - 1, bs do
		if self.sid ~= s.sid then return end
		local r = ev.GetData:InvokeServer(s.sid, i, bs)
		local fr = r.frames or r
		for j, f in ipairs(fr) do
			F[i + j] = buffer.fromstring(b2s(f))
		end
		task.wait()
	end

	-- ensure full load
	while #F < s.total do
		if self.sid ~= s.sid then return end
		task.wait(0.05)
	end

	
	while self.sid == s.sid do
		for idx, buf in ipairs(F) do
			if self.sid ~= s.sid then return end
			e:WritePixelsBuffer(Vector2.new(0, 0), e.Size, buf)
			local baseDelay = s.delays[idx] or 100
			task.wait((baseDelay / 100) / speedMul)
		end
	end
end


return R
