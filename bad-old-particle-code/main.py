from psim import Canvas, Vec
from ptypes import Attractor
import random

def _randpos(xlow, xhigh, ylow, yhigh):
	x = random.random() * (xhigh - xlow) + xlow
	y = random.random() * (yhigh - ylow) + ylow
	return (x, y)

def randpos():
	return _randpos(-100, 100, -100, 100)

def center(*poses):
	p = Vec(0, 0)
	for pos in poses:
		p += pos
	return p / len(poses)

def cohesion(*particles):
	poses = [p.pos for p in particles]
	distsum = 0
	c = center(*poses)
	for pos in poses:
		d = (pos - c).mag()
		distsum += d
	return distsum

def setup():
	particles = [Attractor(i, randpos()) for i in range(10)]
	canvas = Canvas(particles, frametime=1)
	return canvas

def main():
	canvas = setup()
	for i in range(1000): # Running for 10 frames
		canvas.calcframe()
		for particle in canvas.particles:
			particle.velocity = Vec(0, 0)
		if i % 100 == 0:
			l = []
			for particle in canvas.particles:
				l.append(str(particle.pos))
			print(','.join(l))
			print('cohesion: %s' % cohesion(*canvas.particles))

if __name__ == '__main__':
	main()

