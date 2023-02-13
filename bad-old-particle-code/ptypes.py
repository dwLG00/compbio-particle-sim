from psim import Particle, Vec, distance

class Attractor(Particle):
	def __init__(self, *args, **kwargs):
		super().__init__(*args, **kwargs)

	def calcforce(self, particle): #Force applied to particle by self
		coeff = 1
		d = distance(self.pos, particle.pos)
		direction = (self.pos - particle.pos) / d #Unit direction vector
		force = direction * coeff / d**2 #Inverse square law
		return force
