import React, { StrictMode, useState } from "https://esm.sh/react";
import { createRoot } from "https://esm.sh/react-dom/client";
import { Minus, Plus } from "https://esm.sh/lucide-react";

createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<main>
			<PillStepper min={0} defaultValue={3} max={6} />
		</main>
	</StrictMode>
);

function PillStepper({
	min,
	defaultValue,
	max
}: Readonly<PillStepperProps>) {
	// first deal with abnormal value choices
	const _min = Math.min(min, max);
	const _max = max;
	const _defaultValue = Math.max(Math.min(defaultValue, _max), _min);
	const [value, setValue] = useState<number>(_defaultValue);
	// then position fill and icons based on relative value range
	const relativeRange = _max - _min;
	const relativeValue = value - _min;
	const percent = relativeValue / relativeRange || 0;
	const trackStyle: React.CSSProperties = {
		transform: `translateX(${percent * 50}%)`
	};
	const iconStyle: React.CSSProperties = {
		transform: `translateX(${(percent - 0.5) * 100}%)`
	};
	const focusStartStyle: React.CSSProperties = {
		flex: `${percent}`
	};
	const focusEndStyle: React.CSSProperties = {
		flex: `${(1 - percent)}`
	};

	return (
		<div className="stepper">
			<div className="stepper__label">{value}</div>
			<div className="stepper__wrapper">
				<div className="stepper__control">
					<div
						className="stepper__track"
						style={trackStyle}
					>
						<button
							className="stepper__button"
							type="button"
							onClick={() => setValue(val => Math.max(val - 1, _min))}
							disabled={value === _min}
						>
							<span className="stepper__sr">Decrease</span>
						</button>
						<button
							className="stepper__button"
							type="button"
							onClick={() => setValue(val => Math.min(val + 1, _max))}
							disabled={value === _max}
						>
							<span className="stepper__sr">Increase</span>
						</button>
					</div>
					<div className="stepper__icons">
						<div className="stepper__icon" style={iconStyle}>
							<Minus />
						</div>
						<div className="stepper__icon" style={iconStyle}>
							<Plus />
						</div>
					</div>
				</div>
				<div className="stepper__focus">
					<div className="stepper__focus-ring" style={focusStartStyle}></div>
					<div className="stepper__focus-ring" style={focusEndStyle}></div>
				</div>
			</div>
		</div>
	);
}

interface PillStepperProps {
	min: number;
	defaultValue: number;
	max: number;
}