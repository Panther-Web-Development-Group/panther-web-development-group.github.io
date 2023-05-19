class Vector {
	static epsilon = 1e-9;
	static areEqual = (a, b) => Math.abs(a - b) < this.epsilon;
	static randomInt = (a, b) => {
		const m = Math.min(a, b), n = Math.max(a, b);
		return m + Math.random() * (n - m);
	};
	
	static random = (...args) => {
		const components = args.map(arg => this.randomInt(arg.min, arg.max));
		return new Vector(...components);
	};

	static create = (...args) => new Vector(...args);

	constructor(...components) {
		this.components = components;
		this.__arrange__();
	}

	__arrange__() {
		Object.defineProperties(this, this.components.reduce((properties, component, index) => {
			properties[index] = Object.freeze({
				configurable: true,
				writable: true,
				enumerable: true,
				value: component
			});
			return properties;
		}, {}));
	}

	__getComponentOperator__(vector, callback) {
		if (vector.size !== this.size) throw new Error("Both vectors must be the same size.");
		return this.__tap__((component, index) => callback(component, index));
	}

	__getScalarOperator__(callback) {
		return this.__tap__((component, index) => callback(component, index));
	}

	__sum__(callback = n => n) {
		return this.components.reduce((sum, component, index) => {
			const n = callback(component, index);
			if (n === 0 || isNaN(n)) return sum;
			sum = sum + n;
			return sum;
		}, 0);
	}

	__tap__(callback) {
		this.components.forEach((component, index) => callback(component, index));
		this.__arrange__();
		return this;
	}

	get size() { return this.components.length }
	get sum() { return this.__sum__() }
	get average() { return this.sum / this.size }
	get min() { return Math.min(...this.components) }
	get max() { return Math.max(...this.components) }

	get is2D() { return this.size === 2 }
	get is3D() { return this.size === 3 }

	set(...components) {
		components.forEach((component, index) => (this.components[index] = component));
		this.__arrange__();
	}

	add(vector) { return this.__getComponentOperator__(vector, (c, i) => (this.components[i] = c + vector[i])) }
	addBy(increment) { return this.__getScalarOperator__((c, i) => (this.components[i] = c + increment)) }
	subtract(vector) { return this.__getComponentOperator__(vector, (c, i) => (this.components[i] = c + vector[i])) }
	subtractBy(decrement) { return this.__getScalarOperator__((c, i) => (this.components[i] = c + decrement)) }
	multiply(vector) { return this.__getComponentOperator__(vector, (c, i) => (this.components[i] = c * vector[i])) }
	scale(scalar) { return this.__getScalarOperator__((c, i) => (this.components[i] = c * scalar)) }
	dot(vector) { return this.__sum__((c, i) => (vector[i] * c)) }
	
	length() { return Math.sqrt(this.dot(this)) }
	magnitude() { return this.length() }

	negate() { return this.scale(-1) }
	tare() { return this.scale(0) }
	normalize() { return this.scale(1 / this.length()) }

	recip() { return this.__getComponentOperator__((_, i) => (this.components[i] = 1 / this.components[i])) }

	unit() { return this.normalize() }
	clone() { return new Vector(...this.components) }

	hasSameDirectionWith(vector) { 
		const dot = this.normalize().dot(vector.normalize())
		return Vector.areEqual(dot, 1);
	}

	isPerpendicularTo(vector) {
		const dot = this.normalize().dot(vector.normalize())
		return Vector.areEqual(dot, 0);
	}

	hasOppositeDirectionTo(vector) {
		const dot = this.normalize().dot(vector.normalize())
		return Vector.areEqual(dot, -1);
	}

	projectOn(vector) {
		const normalized = vector.normalize();
		return normalized.scale(this.dot(normalized));
	}

	/** @param {number} length */
	withLength(length) { return this.normalize().scale(length) }

	/** @param {Vector} vector */
	equalTo({ components }) {
		return components.every((component, index) => {
			return Vector.areEqual(component, this.components[index]);
		});
	}

	/** @param {Matrix} matrix */
	transform(matrix) {
		if (matrix.columns.length !== this.components.length) throw new Error("Matrix columns must be the same size as the vector's components.");
		const multiplied = matrix.columns.map((c, i) => c.map(r => c * this.components[i]));
		const sum = r => r.reduce((a, v) => a + v, 0);

		const components = multiplied[0].map((_, i) => sum(multiplied.map(col => col[i])));
		return new Vector(...components);
	}
}

class Vector2D extends Vector {
	static random = (...args) => {
		const components = args.map(arg => this.randomInt(arg.min, arg.max));
		return new Vector2D(...components);
	};

	static create = (...args) => new Vector2D(...args);

	constructor(x, y) {
		super(x, y);
		this.type = "2D";
	}

	get x() { return this.components[0] }
	set x(value) { this.components[0] = value }

	get y() { return this.components[1] }
	set y(value) { this.components[1] = value }

	angle() { return Math.atan2(this.y, this.x) }

	angleBetween(vector) {
		if (!vector.is2D) throw new Error("Both vectors must have the same size.");
		return Math.acos(this.dot(vector) / (this.length() * vector.length()));
	}

	clone() { return new Vector2D(this.x, this.y) }

	negateX() { return this.multiply(new Vector2D(-1, 1)) }
	negateY() { return this.multiply(new Vector2D(1, -1)) }
}

class DimensionVector extends Vector {
	static random = (...args) => {
		const components = args.map(arg => this.randomInt(arg.min, arg.max));
		return new DimensionVector(...components);
	};

	static create = (...args) => new DimensionVector(...args);

	constructor(width, height) {
		super(width, height);
		this.type = "Dimension";
	}

	get width() { return this.components[0] }
	set width(value) { this.components[0] = value }

	get height() { return this.components[1] }
	set height(value) { this.components[1] = value }

	get centerX() { return this.width / 2 }
	get centerY() { return this.height / 2 }

	get aspectRatio() { return this.width / this.height }
}

class Vector3D extends Vector {
	static random = (...args) => {
		const components = args.map(arg => this.randomInt(arg.min, arg.max));
		return new Vector3D(...components);
	};

	static create = (...args) => new Vector3D(...args);

	constructor(x, y, z) {
		super(x, y, z);
		this.type = "3D";
	}

	get x() { return this.components[0] }
	set x(value) { this.components[0] = value }

	get y() { return this.components[1] }
	set y(value) { this.components[1] = value }
	
	get z() { return this.components[2] }
	set z(value) { this.components[2] = value }

	angle() { return Math.atan2(this.y, this.x) }

	angleBetween(vector) {
		if (!vector.is3D) throw new Error("Both vectors must have the same size.");
		return Math.acos(this.dot(vector) / (this.length() * vector.length()));
	}

	clone() { return new Vector3D(this.x, this.y, this.z) }

	negateX() { return this.multiply(new Vector2D(-1, 1, 1)) }
	negateY() { return this.multiply(new Vector2D(1, -1, 1)) }
	negateZ() { return this.multiply(new Vector2D(1, 1, -1)) }

	/** @param {Vector3D} vector */
	cross({ x, y, z }) {
		return new Vector3D(
			this.y * z - this.z * y,
			this.z * x - this.x * z,
			this.x * y - this.y * y
		);
	}
}

class Matrix {
	static Identity2 = new Matrix([1, 0], [0, 1]);
	static Identity3 = new Matrix([1, 0, 0], [0, 1, 0], [0, 0, 1]);

	static create(...rows) { return new Matrix(...rows) }

	constructor(...rows) {
		const maxLength = rows.reduce((length, row) => {
			if (!Array.isArray(row)) return length;
			return Math.max(length, row.length);
		}, 0);

		this.rows = rows.filter(row => row.length === maxLength);
	}

	get columns() { return this.rows[0].map((_, i) => this.rows.map(row => row[i])) }
	get rowLength() { return this.rows.length }
	get colLength() { return this.columns.length }
	get isSquare() { return this.rowLength === this.colLength }
	get isIdentity() { return this.isEqual(Matrix.Identity) }

	__tap__(callback) {
		return this.rows.forEach((row, i) => row.forEach((item, j) => callback(item, [i, j]))), this;
	}

	isEqual(matrix) {
		return this.rows.every((row, i) => row.every((item, j) => item === matrix.rows[i][j]));
	}

	each(callback) {
		return this.rows.forEach((row, i) => row.forEach((item, j) => callback.apply(this, [item, [i, j], row, this])));
	}

	tap(callback) { return this.each(callback), this }

	get([i, j]) {
		if ((i < 0 && i >= this.rowLength) ||
			(j < 0 && j >= this.colLength)) throw new RangeError("The row (or column) index must be at least 0 or less than the size.");
		
		return this.rows[i][j];
	}

	getRow(i) {
		if (i < 0 && i >= this.rowLength) throw new RangeError(`The row index must be between 0 and ${this.rowLength}`);
		return this.rows[i];
	}

	getColumn(j) {
		if (j < 0 && j >= this.columnLength) throw new RangeError(`The column index must be between 0 and ${this.colLength}`);
		return this.columns[j];
	}

	set([i, j], value) {
		if ((i < 0 && i >= this.rowLength) ||
			(j < 0 && j >= this.colLength)) throw new RangeError("The row (or column) index must be at least 0 or less than the size.");

		this.rows[i][j] = value;
	}

	determinant() {
		if (!this.isSquare) throw new Error("The matrix must be square");

		switch (this.rowLength) {
			case 1: return this.rows[0][0];
			case 2: {
				const a = this.rows[0][0];
				const b = this.rows[0][1];
				const c = this.rows[1][0];
				const d = this.rows[1][1];

				return (a * d) - (b * c);
			}
			default: {
				return this.rows[0].reduce((det, value, index) => {
					const cofactors = this.rows.slice(1).map(c => c.filter((_, i) => index !== i));
					const cofactorMatrix = new Matrix(...cofactors);
					return det + Math.pow(-1, index) * value * cofactorMatrix.determinant();
				}, 0);
			}
		}
	}

	add(matrix) { return this.__tap__((item, [i, j]) => (this.set([i, j], item + matrix.get([i, j])))) }
	subtract(matrix) { return this.__tap__((item, [i, j]) => (this.set([i, j], item - matrix.get([i, j])))) }
	scale(scalar) { return this.__tap__((item, [i, j]) => (this.set([i, j], item * scalar))) }

	multiply(matrix) {
		if (this.rowLength !== matrix.colLength) throw new Error("The number of columns rows on matrix A must be the same as the number of rows on matrix B.");

		const rows = this.rows.reduce((r, row, i) => {
			r[i] = matrix.columns.reduce((c, column, i2) => {
				c[i2] = column.reduce((s, item, j) => s + (row[j] * item), 0);
				return c;
			}, []);
			return r;
		}, []);

		return new Matrix(...rows);
	}

	cofactor() {
		const rows = this.rows.reduce((r, row, i) => {
			const c = row.reduce((s, _, j) => {
				const sgn = Math.pow(-1, i + j);

				const minors = this.rows.reduce((t, r1, i1) => {
					const r2 = r1.filter((_, j1) => i !== i1 && j !== j1);
					if (r2.length === 0) return t;
					return t.push(r2), t;
				}, []);

				const matrix = new Matrix(...minors);

				s[j] = sgn * matrix.determinant();
				return s;
			}, []);

			r[i] = c;
			return r;
		}, []);

		return new Matrix(...rows);
	}

	transpose() { return new Matrix(...this.columns) }

	adjugate() {
		if (!this.isSquare) throw new Error("The matrix must be square.");

		let rows = [];

		switch (this.rowLength) {
			case 1: {
				rows = [[-this.rows[0][0]]];
				break;
			}
			case 2: {
				const a = this.rows[0][0];
				const b = this.rows[0][1];
				const c = this.rows[1][0];
				const d = this.rows[1][1];

				rows = [[d, -b],[-c, a]];
				break;
			}
			case 3: {
				const a = this.rows[0][0], b = this.rows[0][1];
				const c = this.rows[0][2], d = this.rows[1][0];
				const e = this.rows[1][1], f = this.rows[1][2];
				const g = this.rows[2][0], h = this.rows[2][1];
				const i = this.rows[2][2];

				const a1 = (e * i) - (f * h), a2 = -((b * i) - (c * h)), a3 = (b * f) - (c * e);
				const b1 = -((d * i) - (f * g)), b2 = (a * i) - (c * g), b3 = -((a * f) - (c * d));
				const c1 = (d * h) - (e * g), c2 = -((a * h) - (b * g)), c3 = (a * e) - (b * d);

				rows = [[a1, a2, a3],
						[b1, b2, b3],
						[c1, c2, c3]];
				break;
			}
			default: {
				const cofactor = this.cofactor();
				return cofactor.transpose();
			}
		}

		console.log(rows);

		return new Matrix(...rows);
	}

	inverse() {
		const reciprocal = 1 / this.determinant();
		if (!isFinite(reciprocal) || isNaN(reciprocal)) return null;
		const adjugate = this.adjugate();
		console.log(adjugate);
		return adjugate.scale(reciprocal);
	}
}