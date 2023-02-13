from pmath import Vec
import random

# This is a faithful copy of particle life.

class Particle:
	def __init__(self, pos):
		self.pos = pos
		self.velocity = Vec(0, 0)
		self._force = Vec(0, 0)

	def queue_force(self, p, g):
		dpos = self.pos - p.pos
		d = dpos.mag()
		if d > 0:
			force = g / d
			force_vector = (dpos * force) / d
			self._force += force_vector

	def apply_forces(self):
		new_velocity = (self.velocity + self._force) / 2
		self.pos += new_velocity
		self._force = Vec(0, 0)
		if self.pos.x <= 0 or self.pos.x >= 500 or self.pos.y <= 0 or self.pos.x >= 500:
			self.velocity *= -1

	@classmethod
	def random(cls):
		posx = random.random() * 100 + 200
		posy = random.random() * 100 + 200
		pos = Vec(posx, posy)
		return cls(pos)

def rule(bucket1, bucket2, g):
	for p in bucket1:
		for q in bucket2:
			p.queue_force(q, g)

def pseudoentropy(plist):
	#this is just taking the center point of all points
	center = Vec(0, 0)
	for p in plist:
		center += p.pos
	center = center / len(plist)
	#calculate the average distance of particles from the center
	deviation = sum(((p.pos - center).mag() for p in plist)) / len(plist)
	return deviation

if __name__ == '__main__':

	red = [Particle.random() for _ in range(50)]
	green = [Particle.random() for _ in range(50)]
	blue = [Particle.random() for _ in range(50)]

	def update():
		rule(red, red, -0.32)
		rule(red, green, -0.17)
		rule(red, blue, 0.34)
		rule(green, red, -0.42)
		rule(green, green, 0.3)
		rule(green, blue, -0.74)
		rule(blue, red, 0.23)
		rule(blue, green, -0.52)
		rule(blue, blue, 0.64)

		for p in red:
			p.apply_forces()
		for p in blue:
			p.apply_forces()
		for p in green:
			p.apply_forces()

		'''
		map(lambda p: p.apply_forces(), red)
		map(lambda p: p.apply_forces(), green)
		map(lambda p: p.apply_forces(), blue)
		'''

		print('Red Deviation: %s' % pseudoentropy(red))
		print('Green Deviation: %s' % pseudoentropy(green))
		print('Blue Deviation: %s' % pseudoentropy(blue))
	while True:
		update()
