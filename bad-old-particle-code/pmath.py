import math

class Vec:
	def __init__(self, x, y):
		self.x = x
		self.y = y

	def __add__(self, v):
		return Vec(self.x + v.x, self.y + v.y)

	def __sub__(self, v):
		return Vec(self.x - v.x, self.y - v.y)

	def __mul__(self, v):
		if isinstance(v, Vec):
			return (self.x * v.x) + (self.y * v.y)
		else:
			return Vec(self.x * v, self.y * v)

	def __truediv__(self, v):
		if isinstance(v, Vec):
			pass
		else:
			return Vec(self.x / v, self.y / v)

	def sq(self):
		return Vec(self.x ** 2, self.y ** 2)

	def mag(self):
		return math.sqrt(self.x ** 2 + self.y ** 2)

	def __repr__(self) -> str:
		return '(%s, %s)' % (self.x, self.y)

	def __iter__(self):
		yield from (self.x, self.y)

