class Vector
{
	private _x: number;
	private _y: number;
	private _length: number | undefined;

	public get x()
	{
		return this._x;
	}
	public get y()
	{
		return this._y;
	}
	public get length()
	{
		return this._length ?? (this._length = Math.sqrt(this.x * this.x + this.y * this.y));
	}

	public add(...additions: Vector[])
	{
		additions.forEach((addition) =>
		{
			this._length = undefined;
			this._x += addition.x;
			this._y += addition.y;
		});
	}

	constructor(x: number, y: number)
	{
		this._x = x;
		this._y = y;
	}
}

type point = { x: number, y: number };
type size = { width: number, height: number };

class Utils
{
	public static distance(point1: point, point2: point): number
	{
		const dx = point2.x - point1.x;
		const dy = point2.y - point1.y
		return Math.sqrt(dx * dx + dy * dy);
	}
	public static pointInBounds(bounds: { width: number, height: number }, point: point): boolean
	{
		return point.x >= 0 && point.y >= 0 && point.x <= bounds.width && point.y <= bounds.height;
	}
}

interface ChargeSource
{
	fieldVoltage(point: point): Vector;
}

class PointCharge implements ChargeSource
{
	private _q: number;
	private _position: point;
	private readonly k = 9e9;

	public get q()
	{
		return this._q;
	}
	public get position()
	{
		return this._position;
	}

	public fieldVoltage(point: point): Vector
	{
		const distance = Utils.distance(this.position, point);
		const voltage = this.k * this.q / (distance * distance);
		const distanceVector = new Vector((point.x - this.position.x) / distance, (point.y - this.position.y) / distance);
		const voltageVector = new Vector(distanceVector.x * voltage, distanceVector.y * voltage);

		return voltageVector;
	}

	public constructor(q: number, position: point)
	{
		this._q = q;
		this._position = position;
	}
}

class PhysicalEngine
{
	private static computeChorde(vector: Vector): Vector
	{
		const sizedLength = vector.length / 10;
		return new Vector(vector.x / sizedLength, vector.y / sizedLength);
	}
	private static computeFieldVoltage(charges: ChargeSource[], point: point): Vector
	{
		let result = new Vector(0, 0);

		charges.forEach((charge) =>
		{
			result.add(charge.fieldVoltage(point));
		});

		return result;
	}
	private static computeVoltageLine(charges: ChargeSource[], start: point, bounds: size): point[]
	{
		const points: point[] = [start];
		let lastPoint = start;

		for (let count = 0; count < 200; count++)
		{
			const fieldVoltage = this.computeFieldVoltage(charges, lastPoint);
			const chorde = this.computeChorde(fieldVoltage);
			const newPoint = { x: lastPoint.x + chorde.x, y: lastPoint.y + chorde.y };
			lastPoint = newPoint;

			points.push(newPoint);
		}

		return points;
	}

	public static computeVoltageLinesAroundPointCharge(target: PointCharge, charges: ChargeSource[], density: number, bounds: { width: number, height: number }): point[][]
	{
		const radius = 1;
		const lines: point[][] = [];

		for (let part = 0; part < density; part++)
		{
			const angle = Math.PI * 2 * part / density;
			const point = { x: Math.cos(angle) * radius + target.position.x, y: Math.sin(angle) * radius + target.position.y };
			const line = this.computeVoltageLine(charges, point, bounds);

			lines.push(line);
		}

		return lines;
	}
}

function draw(charges: PointCharge[])
{
	const canvas = document.getElementById("cnvs") as HTMLCanvasElement;
	const context = canvas.getContext("2d");
	const screenSize = { width: 1920, height: 1008 };

	context.clearRect(0, 0, 1920, 1080);

	context.strokeStyle = "black";
	context.lineWidth = 2;

	charges.forEach((charge) =>
	{
		var lines = PhysicalEngine.computeVoltageLinesAroundPointCharge(charge, charges, 50, screenSize);

		lines.forEach((line) =>
		{
			const path = new Path2D;
			path.moveTo(line[0].x, line[0].y);

			line.forEach((p) =>
			{
				path.lineTo(p.x, p.y);
			});
			context.stroke(path);
		});
	});

	context.beginPath();
	charges.forEach((charge) =>
	{
		context.fillStyle = charge.q < 0 ? "blue" : "red";
		context.arc(charge.position.x, charge.position.y, 10, 0, Math.PI * 2);
		context.fill();
	});
}

window.onload = () =>
{
	const charges = [new PointCharge(-1, { x: 300, y: 200 }), new PointCharge(10, { x: 300, y: 400 })];

	var t = 0;

	setInterval(() =>
	{
		const a = Math.random() * Math.PI * 2;
		charges[0].position.x = Math.cos(t) * 200 + 300;
		charges[0].position.y = Math.sin(t) * 200 + 400;

		draw(charges);

		t += 0.01;
	}, 20);
};

