import math
from pmath import Vec

class Canvas:
	def __init__(self, particles, frametime=1):
		self.particles = particles
		self.frametime = frametime

	def calcframe(self):
		for p in self.particles:
			#Calculate net force on particle
			force = Vec(0, 0)
			for q in self.particles:
				if p.id == q.id:
					pass
				else:
					force += q.calcforce(p)
			#Calculate net velocity from force
			dvel = force * self.frametime
			p.velocity += dvel

		#Apply positional difference from velocity
		for p in self.particles:
			p.pos += p.velocity * self.frametime

class Particle:
	def __init__(self, id, pos):
		self.id = id
		self.pos = Vec(*pos)
		self.velocity = Vec(0, 0)
		#self.orientation = Vec(0, 0) #2D vector on Cartesian coords (i.e. (x, y))
		self.weight = 1

	def calcforce(self, particle):
		d = distance(self.pos, particle.pos)
		# Do some math or whatever
		pass

def distance(pos1, pos2):
	return (pos2 - pos1).mag()
