import { SyncHook, AsyncParallelHook } from 'tapable'

class List {
  getRoutes() {
    console.log('getRoutes')
  }
}

class Car {
  constructor() {
    this.hooks = {
      accelerate: new SyncHook(['newSpeed']),
      break: new SyncHook(),
      calculateRoutes: new AsyncParallelHook(["source", "target", "routesList"])
    }
  }

  setSpeed(newSpeed) {
		// following call returns undefined even when you returned values
		this.hooks.accelerate.call(newSpeed);
	}

	useNavigationSystemPromise(source, target) {
		const routesList = new List();
		return this.hooks.calculateRoutes.promise(source, target, routesList).then((res) => {
			// res is undefined for AsyncParallelHook
			return routesList.getRoutes();
		});
	}

	useNavigationSystemAsync(source, target, callback) {
		const routesList = new List();
		this.hooks.calculateRoutes.callAsync(source, target, routesList, err => {
			if(err) return callback(err);
			callback(null, routesList.getRoutes());
		});
	}
}

const car = new Car()

// 注册
car.hooks.accelerate.tap('test1', (data) => {
  console.log('accelerate', data)
})

car.hooks.calculateRoutes.tapPromise('test2', (source, target) => {
  return new Promise(resolve => {
    console.log('tapPromise', source, target)
    resolve()
  })
})

car.hooks.calculateRoutes.tapAsync('test3', (source, target) => {
  console.log('tapAsync', source, target)
})

// 触发
car.setSpeed(123)
car.useNavigationSystemPromise('1', 2)
car.useNavigationSystemAsync('2', 1)