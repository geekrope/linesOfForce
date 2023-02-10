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

class Settings
{
	public static readonly k = 9 * 1e9;
	public static readonly chordeLength = 5;
	public static readonly lineNodesCount = 1000;
	public static readonly linesDensity = 50;
	public static readonly doublePI = Math.PI * 2;
	public static readonly positiveChargeColor = "red";
	public static readonly negativeChargeColor = "blue";
}

interface ChargeSource
{
	fieldVoltage(point: point): Vector;
}

class PointCharge implements ChargeSource
{
	private _q: number;
	private _position: point;

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
		const voltage = Settings.k * this.q / (distance * distance);
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
		const scalor = vector.length / Settings.chordeLength;

		return new Vector(vector.x / scalor, vector.y / scalor);
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

		for (let count = 0; count < Settings.lineNodesCount; count++)
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
			const angle = Settings.doublePI * part / density;
			const point = { x: Math.cos(angle) * radius + target.position.x, y: Math.sin(angle) * radius + target.position.y };
			const line = this.computeVoltageLine(charges, point, bounds);

			lines.push(line);
		}

		return lines;
	}
}

class VisualEngine
{
	private static drawLine(points: point[]): Path2D
	{
		const path = new Path2D();
		path.moveTo(points[0].x, points[0].y);

		for (let index = 1; index < points.length; index++)
		{
			const point = points[index];
			path.lineTo(point.x, point.y);
		}

		return path;
	}
	private static drawCircle(center: point, radius: number): Path2D
	{
		const path = new Path2D();
		path.arc(center.x, center.y, radius, 0, Settings.doublePI);

		return path;
	}

	public static drawPointCharge(context: CanvasRenderingContext2D, charge: PointCharge)
	{
		const radius = 10;
		const path = VisualEngine.drawCircle(charge.position, radius);

		context.fillStyle = charge.q < 0 ? Settings.negativeChargeColor : Settings.positiveChargeColor;
		context.fill(path);
	}
	public static drawFieldVoltageLine(context: CanvasRenderingContext2D, line: point[])
	{
		const lineWidth = 1;
		const color = "black";
		const path = VisualEngine.drawLine(line);

		context.strokeStyle = color;
		context.lineWidth = lineWidth;
		context.stroke(path);
	}
}

class Scene
{
	private _renderingContext: CanvasRenderingContext2D;
	private _charges: ChargeSource[];

	private computeVoltageLines(): point[][]
	{
		const lines: point[][] = [];

		this._charges.forEach((charge) =>
		{
			let readyToPush: point[][] = [];

			if (charge instanceof PointCharge)
			{
				readyToPush = PhysicalEngine.computeVoltageLinesAroundPointCharge(charge, this._charges, Settings.linesDensity, { width: 0, height: 0 });
			}
			else
			{
				throw new Error("oops");
			}

			readyToPush.forEach((line) => { lines.push(line) });
		});

		return lines;
	}

	public draw()
	{
		const voltageLines = this.computeVoltageLines();

		this._renderingContext.clearRect(0, 0, this._renderingContext.canvas.width, this._renderingContext.canvas.height);

		voltageLines.forEach((line) =>
		{
			VisualEngine.drawFieldVoltageLine(this._renderingContext, line);
		});
		this._charges.forEach((charge) =>
		{
			if (charge instanceof PointCharge)
			{
				VisualEngine.drawPointCharge(this._renderingContext, charge);
			}
			else
			{
				throw new Error("oops");
			}
		});
	}

	public constructor(renderingContext: CanvasRenderingContext2D, charges: ChargeSource[])
	{
		this._renderingContext = renderingContext;
		this._charges = charges;
	}
}

window.onload = () =>
{
	const charges = [new PointCharge(1, { x: 300, y: 200 }), new PointCharge(-1, { x: 300, y: 400 })];
	const canvas = document.getElementById("cnvs") as HTMLCanvasElement;
	const context = canvas.getContext("2d");
	const scene = new Scene(context, charges);
	let t = 0;
	const draw = () =>
	{
		charges[0].position.x = Math.cos(t) * 200 + 300;
		charges[0].position.y = Math.sin(t) * 200 + 400;

		scene.draw();

		t += 0.01;

		requestAnimationFrame(draw);
	};

	canvas.width = this.innerWidth;
	canvas.height = this.innerHeight;

	draw();
};

