import React, { StrictMode, useState } from "https://esm.sh/react";
import { createRoot } from "https://esm.sh/react-dom/client";
import { Minus, Plus } from "https://esm.sh/lucide-react";
createRoot(document.getElementById("root")).render(React.createElement(StrictMode, null,
    React.createElement("main", null,
        React.createElement(PillStepper, { min: 0, defaultValue: 3, max: 6 }))));
function PillStepper({ min, defaultValue, max }) {
    // first deal with abnormal value choices
    const _min = Math.min(min, max);
    const _max = max;
    const _defaultValue = Math.max(Math.min(defaultValue, _max), _min);
    const [value, setValue] = useState(_defaultValue);
    // then position fill and icons based on relative value range
    const relativeRange = _max - _min;
    const relativeValue = value - _min;
    const percent = relativeValue / relativeRange || 0;
    const trackStyle = {
        transform: `translateX(${percent * 50}%)`
    };
    const iconStyle = {
        transform: `translateX(${(percent - 0.5) * 100}%)`
    };
    const focusStartStyle = {
        flex: `${percent}`
    };
    const focusEndStyle = {
        flex: `${(1 - percent)}`
    };
    return (React.createElement("div", { className: "stepper" },
        React.createElement("div", { className: "stepper__label" }, value),
        React.createElement("div", { className: "stepper__wrapper" },
            React.createElement("div", { className: "stepper__control" },
                React.createElement("div", { className: "stepper__track", style: trackStyle },
                    React.createElement("button", { className: "stepper__button", type: "button", onClick: () => setValue(val => Math.max(val - 1, _min)), disabled: value === _min },
                        React.createElement("span", { className: "stepper__sr" }, "Decrease")),
                    React.createElement("button", { className: "stepper__button", type: "button", onClick: () => setValue(val => Math.min(val + 1, _max)), disabled: value === _max },
                        React.createElement("span", { className: "stepper__sr" }, "Increase"))),
                React.createElement("div", { className: "stepper__icons" },
                    React.createElement("div", { className: "stepper__icon", style: iconStyle },
                        React.createElement(Minus, null)),
                    React.createElement("div", { className: "stepper__icon", style: iconStyle },
                        React.createElement(Plus, null)))),
            React.createElement("div", { className: "stepper__focus" },
                React.createElement("div", { className: "stepper__focus-ring", style: focusStartStyle }),
                React.createElement("div", { className: "stepper__focus-ring", style: focusEndStyle })))));
}