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
class Settings {
}
Settings.k = 9 * 1e9;
Settings.chordeLength = 5;
Settings.lineNodesCount = 1000;
Settings.linesDensity = 50;
Settings.doublePI = Math.PI * 2;
Settings.positiveChargeColor = "red";
Settings.negativeChargeColor = "blue";
class PointCharge {
    constructor(q, position) {
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
        const voltage = Settings.k * this.q / (distance * distance);
        const distanceVector = new Vector((point.x - this.position.x) / distance, (point.y - this.position.y) / distance);
        const voltageVector = new Vector(distanceVector.x * voltage, distanceVector.y * voltage);
        return voltageVector;
    }
}
class PhysicalEngine {
    static computeChorde(vector) {
        const scalor = vector.length / Settings.chordeLength;
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
        for (let count = 0; count < Settings.lineNodesCount; count++) {
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
            const angle = Settings.doublePI * part / density;
            const point = { x: Math.cos(angle) * radius + target.position.x, y: Math.sin(angle) * radius + target.position.y };
            const line = this.computeVoltageLine(charges, point, bounds);
            lines.push(line);
        }
        return lines;
    }
}
class VisualEngine {
    static drawLine(points) {
        const path = new Path2D();
        path.moveTo(points[0].x, points[0].y);
        for (let index = 1; index < points.length; index++) {
            const point = points[index];
            path.lineTo(point.x, point.y);
        }
        return path;
    }
    static drawCircle(center, radius) {
        const path = new Path2D();
        path.arc(center.x, center.y, radius, 0, Settings.doublePI);
        return path;
    }
    static drawPointCharge(context, charge) {
        const radius = 10;
        const path = VisualEngine.drawCircle(charge.position, radius);
        context.fillStyle = charge.q < 0 ? Settings.negativeChargeColor : Settings.positiveChargeColor;
        context.fill(path);
    }
    static drawFieldVoltageLine(context, line) {
        const lineWidth = 1;
        const color = "black";
        const path = VisualEngine.drawLine(line);
        context.strokeStyle = color;
        context.lineWidth = lineWidth;
        context.stroke(path);
    }
}
class Scene {
    constructor(renderingContext, charges) {
        this._renderingContext = renderingContext;
        this._charges = charges;
    }
    computeVoltageLines() {
        const lines = [];
        this._charges.forEach((charge) => {
            let readyToPush = [];
            if (charge instanceof PointCharge) {
                readyToPush = PhysicalEngine.computeVoltageLinesAroundPointCharge(charge, this._charges, Settings.linesDensity, { width: 0, height: 0 });
            }
            else {
                throw new Error("oops");
            }
            readyToPush.forEach((line) => { lines.push(line); });
        });
        return lines;
    }
    draw() {
        const voltageLines = this.computeVoltageLines();
        this._renderingContext.clearRect(0, 0, this._renderingContext.canvas.width, this._renderingContext.canvas.height);
        voltageLines.forEach((line) => {
            VisualEngine.drawFieldVoltageLine(this._renderingContext, line);
        });
        this._charges.forEach((charge) => {
            if (charge instanceof PointCharge) {
                VisualEngine.drawPointCharge(this._renderingContext, charge);
            }
            else {
                throw new Error("oops");
            }
        });
    }
}
window.onload = () => {
    const charges = [new PointCharge(1, { x: 300, y: 200 }), new PointCharge(-1, { x: 300, y: 400 })];
    const canvas = document.getElementById("cnvs");
    const context = canvas.getContext("2d");
    const scene = new Scene(context, charges);
    let t = 0;
    const draw = () => {
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
//# sourceMappingURL=app.js.map