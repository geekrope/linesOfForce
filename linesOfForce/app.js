class Vector {
    constructor(x, y) {
        this._x = x;
        this._y = y;
    }
    get x() {
        return this._x;
    }
    get y() {
        return this._y;
    }
    get length() {
        var _a;
        return (_a = this._length) !== null && _a !== void 0 ? _a : (this._length = Math.sqrt(this.x * this.x + this.y * this.y));
    }
    add(...additions) {
        additions.forEach((addition) => {
            this._length = undefined;
            this._x += addition.x;
            this._y += addition.y;
        });
    }
}
class Utils {
    static distance(point1, point2) {
        const dx = point2.x - point1.x;
        const dy = point2.y - point1.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
    static pointInBounds(bounds, point) {
        return point.x >= 0 && point.y >= 0 && point.x <= bounds.width && point.y <= bounds.height;
    }
}
class PointCharge {
    constructor(q, position) {
        this.k = 9e9;
        this._q = q;
        this._position = position;
    }
    get q() {
        return this._q;
    }
    get position() {
        return this._position;
    }
    fieldVoltage(point) {
        const distance = Utils.distance(this.position, point);
        const voltage = this.k * this.q / (distance * distance);
        const distanceVector = new Vector((point.x - this.position.x) / distance, (point.y - this.position.y) / distance);
        const voltageVector = new Vector(distanceVector.x * voltage, distanceVector.y * voltage);
        return voltageVector;
    }
}
class PhysicalEngine {
    static computeChorde(vector) {
        const scalor = vector.length / 5;
        return new Vector(vector.x / scalor, vector.y / scalor);
    }
    static computeFieldVoltage(charges, point) {
        let result = new Vector(0, 0);
        charges.forEach((charge) => {
            result.add(charge.fieldVoltage(point));
        });
        return result;
    }
    static computeVoltageLine(charges, start, bounds) {
        const points = [start];
        let lastPoint = start;
        for (let count = 0; count < 800; count++) {
            const fieldVoltage = this.computeFieldVoltage(charges, lastPoint);
            const chorde = this.computeChorde(fieldVoltage);
            const newPoint = { x: lastPoint.x + chorde.x, y: lastPoint.y + chorde.y };
            lastPoint = newPoint;
            points.push(newPoint);
        }
        return points;
    }
    static computeVoltageLinesAroundPointCharge(target, charges, density, bounds) {
        const radius = 1;
        const lines = [];
        for (let part = 0; part < density; part++) {
            const angle = Math.PI * 2 * part / density;
            const point = { x: Math.cos(angle) * radius + target.position.x, y: Math.sin(angle) * radius + target.position.y };
            const line = this.computeVoltageLine(charges, point, bounds);
            lines.push(line);
        }
        return lines;
    }
}
function draw(charges) {
    const canvas = document.getElementById("cnvs");
    const context = canvas.getContext("2d");
    const screenSize = { width: 1920, height: 1008 };
    context.clearRect(0, 0, 1920, 1080);
    context.strokeStyle = "black";
    context.lineWidth = 2;
    charges.forEach((charge) => {
        var lines = PhysicalEngine.computeVoltageLinesAroundPointCharge(charge, charges, 10, screenSize);
        lines.forEach((line) => {
            const path = new Path2D();
            path.moveTo(line[0].x, line[0].y);
            line.forEach((p) => {
                path.lineTo(p.x, p.y);
            });
            context.stroke(path);
        });
    });
    charges.forEach((charge) => {
        context.beginPath();
        context.fillStyle = charge.q < 0 ? "blue" : "red";
        context.arc(charge.position.x, charge.position.y, 10, 0, Math.PI * 2);
        context.fill();
    });
}
window.onload = () => {
    const charges = [new PointCharge(1, { x: 300, y: 200 }), new PointCharge(10, { x: 300, y: 400 }), new PointCharge(-10, { x: 900, y: 400 })];
    var t = 0;
    setInterval(() => {
        const a = Math.random() * Math.PI * 2;
        charges[0].position.x = Math.cos(t) * 200 + 300;
        charges[0].position.y = Math.sin(t) * 200 + 400;
        draw(charges);
        t += 0.01;
    }, 20);
};
//# sourceMappingURL=app.js.map