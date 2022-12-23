const Global = class {
    static count = 0
    static fps = 60
    static run = true
    static bezierListInput = [
        // [[200, 120], [170, 50], [80, 80], [40, 140], [90, 200], [200, 280]],
        // [[200, 280], [310, 200], [360, 140], [320, 80], [230, 50], [200, 120]]
    ]
    static radiusCircle = 5
    // static pList = []
    // static indexPMousedown = null
    static indexBezierListCircleMove = 0
    static pBezierListCircleMove = []
    static lenBezierListCircleMoveAll = []
    // static directionCircleMove = 'right'
    static indexPCircleMove = 0
    static preEvent = null
    static preEventType = {
        addPosition: 0,
        movePosition: 1,
        deletePosition: 2,
        captureOldPosition: 3
    }
    // static pListCurve = []
    static pPointer = [-100, 0]
    static indexCurBezier = null
    static bezierList = []
    static curBezier = null
    static pPreCircleMove = [0, 0]
    static lenMovePre1sec = 0
    static lenMove = 0
    static speedMove = 0
    static speedMovePreSet = 100
    // 单位px/s
    static speedMoveSet = 0
    static pListMouseDown = []
}

const Bezier = class  {
    constructor(pList = []) {
        this.pList = pList
        this.pListCurve = []
        this.indexPCircleMove = 0
        this.indexPMousedown = null
    }
}

const calcInterpolation = function (p1, p2, t) {
    return (1 - t) * p1 + t * p2
}

const calcPCurve = function (l, t) {
    if (l.length === 1) {
        return l[0]
    }
    let i = 0
    const l2 = []
    while (1) {
        const p1 = l[i]
        const p2 = l[i + 1]
        l2.push(calcInterpolation(p1, p2, t))
        if (i === l.length - 2) {
            break
        } else {
            i++
        }
    }
    return calcPCurve(l2, t)
}

const calcArcLen = function (l) {
    let len = 0
    for (let i = 0; i < l.length; i++) {
        const cur = l[i]
        const next = l[i + 1]
        if (next === undefined) {
            break
        } else {

        }
        const [x1, y1] = cur
        const [x2, y2] = next
        len += Math.sqrt(Math.pow((x1 - x2), 2) + Math.pow((y1 - y2), 2))
    }
    return len
}

const calcDistanceTwoPoint = function (x1, y1, x2, y2) {
    let dep = Math.sqrt(Math.pow((x1 - x2), 2) + Math.pow((y1 - y2), 2))
    return dep
}

// x1, y1 是否在圆心为x2, y2，半径为r的圆圈里面
const isInCircle = function (x1, y1, x2, y2, r) {
    if (x1 > (x2 - r ) && x1 < (x2 + r)) {
        if (y1 > (y2 - r) && y1 < (y2 + r)) {
            return true
        }
    }
    return false
}


const pUniformSpeed = function (len) {
    let lenCount = 0
    let i = 0
    while (1) {
        let cur = Global.pBezierListCircleMove[i]
        let next = Global.pBezierListCircleMove[i + 1]
        if (next) {
            const [xCur, yCur] = cur
            const [xNext, yNext] = next

            const distance = calcDistanceTwoPoint(xCur, yCur, xNext, yNext)

            lenCount += distance

            // 刚好长度等于下个点的长度
            if (lenCount === len) {
                return next
            }

            // 超过，取插值
            if (lenCount > len) {
                const lenDiff = len - (lenCount - distance)
                // 比例
                const t = lenDiff / distance
                const x = calcInterpolation(xCur, xNext, t)
                const y = calcInterpolation(yCur, yNext, t)
                return [x, y]
            }
            i++
        } else {
            i = 0
        }
    }
}

const bindEventMouseDown = function (e) {
    e.addEventListener('mousedown', (event) => {
        const xEvent = event.offsetX
        const yEvent = event.offsetY
        let moveDownPOld = false

        if (Global.curBezier === null) {
            Global.curBezier = new Bezier()
            Global.bezierList.push(Global.curBezier)
            Global.indexCurBezier = Global.bezierList.length - 1
        }

        if (Global.pListMouseDown === null) {
            const l = []
            for (const bezier of Global.bezierList) {
                for (let i = 0; i < bezier.pList.length; i++) {
                    const p = bezier.pList[i]
                    const [x, y] = p
                    if (isInCircle(xEvent, yEvent, x, y, Global.radiusCircle)) {
                        const o = {
                            bezier: bezier,
                            indexPList: i,
                        }
                        l.push(o)
                        Global.preEvent = Global.preEventType.captureOldPosition
                    }
                }
            }

            if (l.length > 0) {
                Global.pListMouseDown = l
            }
        }
        // 增加控制点
        if (Global.pListMouseDown === null) {
            const pNew = [xEvent, yEvent]
            if (Global.curBezier.pList.length > 1) {
                const last = Global.curBezier.pList.pop()
                Global.curBezier.pList.push(pNew)
                Global.curBezier.pList.push(last)
            } else {
                Global.curBezier.pList.push(pNew)
            }
            Global.preEvent = Global.preEventType.addPosition
        }
    })
}

const bindEventMouseLeave = function (e) {
    e.addEventListener('mouseleave', () => {
        Global.pPointer = [-100, 0]
    })
}

const bindEventMouseUp = function (e) {
    e.addEventListener('mouseup', () => {
        if (Global.preEvent === Global.preEventType.captureOldPosition) {
            for (const o of Global.pListMouseDown) {
                o.bezier.pList.splice(o.indexPList, 1)
            }
            Global.preEvent = Global.preEventType.deletePosition
        }

        Global.pListMouseDown = null
    })
}

const bindEventMouseMove = function (e) {
    e.addEventListener('mousemove', (event) => {
        const xEvent = event.offsetX
        const yEvent = event.offsetY
        Global.pPointer = [xEvent, yEvent]
        if (Global.curBezier === null) {
            return
        }
        if (Global.pListMouseDown !== null) {
            for (const o of Global.pListMouseDown) {
                o.bezier.pList[o.indexPList] = [xEvent, yEvent]
                const [xNow, yNow] = o.bezier.pList[o.indexPList]
                // 拼接
                for (const bezier of Global.bezierList) {
                    for (const p of bezier.pList) {
                        const [xOther, yOther] = p
                        if (isInCircle(xNow, yNow, xOther, yOther, Global.radiusCircle)) {
                            o.bezier.pList[o.indexPList] = [xOther, yOther]
                        }
                    }
                }
            }
            Global.preEvent = Global.preEventType.movePosition
        }
    })
}

const bindEventButton = function () {
    const button = e("#id-button")
    button.addEventListener('click', () => {
        const t = e('#id-text-input')
        let s = ''
        s = '[\r'
        for (const p of Global.pBezierListCircleMove) {
            const objP = {
                x: p[0],
                y: p[1]
            }
            s += `  ${JSON.stringify(objP)}`
            s += ',\r'
        }
        s += ']'
        t.value = s
    })
    const buttonInput = e('#id-button-input')
    buttonInput.addEventListener('click', () => {
        const t = e('#id-text-input')
        const l = eval(t.value)
        Global.bezierList = []
        for (const lElement of l) {
            Global.bezierList.push(new Bezier(lElement))
            Global.indexCurBezier = Global.bezierList.length - 1
            Global.curBezier = Global.bezierList[Global.indexCurBezier]
        }
    })
}

const bindEventKeyDown = function () {
    window.addEventListener('keydown', (event) => {
        if (event.key === 'P') {
            Global.run = !Global.run
        } else if (event.key === 'N' || event.key === 'n') {
            // 新建曲线
            Global.curBezier = null
        } else if (event.key === 'Q' || event.key === 'q') {
            if (Global.indexCurBezier !== null) {
                if (Global.bezierList[Global.indexCurBezier - 1]) {
                    Global.indexCurBezier--
                } else {
                    Global.indexCurBezier = Global.bezierList.length - 1
                }
            }
            Global.curBezier = Global.bezierList[Global.indexCurBezier]
        } else if ((event.key === 'Z' || event.key === 'z') && event.metaKey) {
            if (Global.curBezier) {
                if (Global.curBezier.pList.length >= 3) {
                    Global.curBezier.pList.splice(-2,1)
                } else {
                    Global.curBezier.pList.pop()
                }
            }
        }
    })
}

const bindEventRange = function () {
    const range = e("#id-range")
    range.addEventListener('input', () => {
        Global.speedMoveSet = Global.speedMovePreSet / 50 * Number(range.value)
    })
}

const bindEvent = function (e) {
    bindEventButton()
    bindEventMouseDown(e)
    bindEventMouseUp(e)
    bindEventMouseMove(e)
    bindEventMouseLeave(e)
    bindEventKeyDown()
    bindEventRange()
}

const clear = function (canvas, ctx) {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
}

const drawCure = function (l, ctx, color = 'black') {
    ctx.beginPath()
    for (let i = 0; i < l.length; i++) {
        const p = l[i]
        const [x, y] = p
        ctx.strokeStyle = color
        if (i === 0) {
            ctx.moveTo(x, y)
        } else {
            ctx.lineTo(x, y)
            ctx.moveTo(x, y)
        }
    }
    ctx.stroke()
}

const drawBezier = function (ctx) {
    // TODO: 这里以后要抽离出来，draw方法不能有副作用
    for (const bezier of Global.bezierList) {
        bezier.pListCurve = []
        if (bezier.pList.length > 1) {
            let t = 0
            const lx = bezier.pList.map(p => p[0])
            const ly = bezier.pList.map(p => p[1])
            while (t <= 1) {
                const x = calcPCurve(lx, t)
                const y = calcPCurve(ly, t)
                bezier.pListCurve.push([x, y])
                t += 0.01
            }
            let color
            if (bezier === Global.curBezier) {
                color = 'blue'
            } else {
                color = 'black'
            }
            drawCure(bezier.pListCurve, ctx, color)
        }
    }
    // TODO: 这里以后要抽离出来，draw方法不能有副作用
    Global.pBezierListCircleMove = []
    for (const bezier of Global.bezierList) {
        Global.pBezierListCircleMove = Global.pBezierListCircleMove.concat(bezier.pListCurve)
    }
    Global.lenBezierListCircleMoveAll = 0
    for (let i = 0; i < Global.pBezierListCircleMove; i++) {
        const cur = Global.pBezierListCircleMove[i]
        const next = Global.pBezierListCircleMove[i + 1]
        if (next) {
            const [x1, y1] = cur
            const [x2, y2] = next
            Global.lenBezierListCircleMoveAll += calcDistanceTwoPoint(x1, y1, x2, y2)
        }
    }
}

const drawPList = function (ctx) {
    for (const bezier of Global.bezierList) {
        for (let i = 0; i < bezier.pList.length; i++) {
            const e = bezier.pList[i]
            const [x, y] = e
            ctx.beginPath()
            ctx.arc(x, y, Global.radiusCircle, 0, 2 * Math.PI)
            if (i === 0 || i === bezier.pList.length - 1) {
                ctx.fillStyle = "red"
            } else {
                ctx.fillStyle = "blue"
            }
            ctx.fill()
            ctx.stroke()
        }
    }

}

const drawPListLine = function (ctx) {
    for (const bezier of Global.bezierList) {
        if (bezier.pList.length > 2) {
            let i = 0
            while (1) {
                if (i === bezier.pList.length - 1) {
                    break
                }
                const start = bezier.pList[i]
                const [xStart, yStart] = start
                const end = bezier.pList[i + 1]
                const [xEnd, yEnd] = end
                ctx.beginPath()
                ctx.strokeStyle = "pink"
                ctx.moveTo(xStart, yStart)
                ctx.lineTo(xEnd, yEnd)
                ctx.stroke()
                i++
            }
        }
    }
}

const drawArcLen = function (ctx) {
    if (Global.curBezier === null) {
        return
    }
    const len = calcArcLen(Global.curBezier.pListCurve)
    ctx.beginPath()
    ctx.fillStyle = "black"
    ctx.font = "20px serif"
    ctx.fillText(`弧长：${len}px`, 160, 480)
}

const drawSpeedMove = function (ctx) {
    ctx.beginPath()
    ctx.fillStyle = "black"
    ctx.font = "20px serif"
    ctx.fillText(`速度：${Global.speedMove.toFixed(2)}px/s`, 10, 480)
}

const drawCircleMove = function (ctx) {
    if (Global.pBezierListCircleMove.length > 0) {
        Global.lenMove += Global.speedMoveSet / Global.fps
        if (Global.lenMove > Global.lenBezierListCircleMoveAll) {
            Global.lenMove = Global.lenMove - Global.lenBezierListCircleMoveAll
        }
        const [x, y] = pUniformSpeed(Global.lenMove)
        ctx.strokeStyle = "red"
        ctx.fillStyle = "red"
        ctx.beginPath()
        ctx.arc(x, y, Global.radiusCircle, 0, 2 * Math.PI)
        ctx.fill()
    }
}

const draw = function (ctx) {
    drawBezier(ctx)
    drawPList(ctx)
    drawPListLine(ctx)
    drawArcLen(ctx)
    drawCircleMove(ctx)
    drawSpeedMove(ctx)
}

const initFromInput = function () {
    for (const e of Global.bezierListInput) {
        const b = new Bezier(e)
        Global.bezierList.push(b)
    }

    if (Global.bezierList.length > 0) {
        Global.curBezier = Global.bezierList[Global.bezierList.length - 1]
    }
}


const __main = function () {
    initFromInput()

    Global.speedMoveSet = Global.speedMovePreSet

    //当图片准备以后再绘制
    const canvas = e("#id-canvas")
    const ctx = canvas.getContext("2d")
    bindEvent(canvas)
    const loop = function () {
        if (Global.run) {
            clear(canvas, ctx)
            draw(ctx)
        }
        Global.count++
        if (Global.count === Global.fps) {
            Global.count = 0
            Global.speedMove = Global.lenMove - Global.lenMovePre1sec
            Global.lenMovePre1sec = Global.lenMove
        }
        setTimeout(loop, 1000 / Global.fps)
    }
    loop()
}

__main()