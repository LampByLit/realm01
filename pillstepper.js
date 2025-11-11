// PillStepper Component - Vanilla JS version
export class PillStepper {
    constructor(container, options = {}) {
        this.min = Math.min(options.min || 0, options.max || 10);
        this.max = options.max || 10;
        this.defaultValue = Math.max(Math.min(options.defaultValue || 0, this.max), this.min);
        this.value = this.defaultValue;
        this.onChange = options.onChange || (() => {});
        this.labelText = options.label || '';
        
        this.container = container;
        this.render();
    }
    
    updateStyles() {
        const relativeRange = this.max - this.min;
        const relativeValue = this.value - this.min;
        const percent = relativeRange > 0 ? relativeValue / relativeRange : 0;
        
        this.track.style.transform = `translateX(${percent * 50}%)`;
        this.icon1.style.transform = `translateX(${(percent - 0.5) * 100}%)`;
        this.icon2.style.transform = `translateX(${(percent - 0.5) * 100}%)`;
        this.focusStart.style.flex = `${percent}`;
        this.focusEnd.style.flex = `${1 - percent}`;
        
        this.label.textContent = this.value;
        
        // Update disabled states
        this.decreaseBtn.disabled = this.value === this.min;
        this.increaseBtn.disabled = this.value === this.max;
    }
    
    decrease() {
        if (this.value > this.min) {
            this.value--;
            this.updateStyles();
            this.onChange(this.value);
        }
    }
    
    increase() {
        if (this.value < this.max) {
            this.value++;
            this.updateStyles();
            this.onChange(this.value);
        }
    }
    
    render() {
        const wrapper = document.createElement('div');
        wrapper.className = 'stepper-wrapper';
        
        // Label text above stepper
        if (this.labelText) {
            const labelTextEl = document.createElement('div');
            labelTextEl.className = 'stepper__label-text';
            labelTextEl.textContent = this.labelText;
            wrapper.appendChild(labelTextEl);
        }
        
        const stepper = document.createElement('div');
        stepper.className = 'stepper';
        
        // Value label
        this.label = document.createElement('div');
        this.label.className = 'stepper__label';
        this.label.textContent = this.value;
        
        // Stepper wrapper
        const stepperWrapper = document.createElement('div');
        stepperWrapper.className = 'stepper__wrapper';
        
        // Control
        const control = document.createElement('div');
        control.className = 'stepper__control';
        
        // Track
        this.track = document.createElement('div');
        this.track.className = 'stepper__track';
        
        // Decrease button
        this.decreaseBtn = document.createElement('button');
        this.decreaseBtn.className = 'stepper__button';
        this.decreaseBtn.type = 'button';
        this.decreaseBtn.addEventListener('click', () => this.decrease());
        const sr1 = document.createElement('span');
        sr1.className = 'stepper__sr';
        sr1.textContent = 'Decrease';
        this.decreaseBtn.appendChild(sr1);
        
        // Increase button
        this.increaseBtn = document.createElement('button');
        this.increaseBtn.className = 'stepper__button';
        this.increaseBtn.type = 'button';
        this.increaseBtn.addEventListener('click', () => this.increase());
        const sr2 = document.createElement('span');
        sr2.className = 'stepper__sr';
        sr2.textContent = 'Increase';
        this.increaseBtn.appendChild(sr2);
        
        this.track.appendChild(this.decreaseBtn);
        this.track.appendChild(this.increaseBtn);
        
        // Icons
        const icons = document.createElement('div');
        icons.className = 'stepper__icons';
        
        this.icon1 = document.createElement('div');
        this.icon1.className = 'stepper__icon';
        this.icon1.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"></line></svg>';
        
        this.icon2 = document.createElement('div');
        this.icon2.className = 'stepper__icon';
        this.icon2.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>';
        
        icons.appendChild(this.icon1);
        icons.appendChild(this.icon2);
        
        // Focus rings
        const focus = document.createElement('div');
        focus.className = 'stepper__focus';
        
        this.focusStart = document.createElement('div');
        this.focusStart.className = 'stepper__focus-ring';
        
        this.focusEnd = document.createElement('div');
        this.focusEnd.className = 'stepper__focus-ring';
        
        focus.appendChild(this.focusStart);
        focus.appendChild(this.focusEnd);
        
        control.appendChild(this.track);
        control.appendChild(icons);
        stepperWrapper.appendChild(control);
        stepperWrapper.appendChild(focus);
        
        stepper.appendChild(this.label);
        stepper.appendChild(stepperWrapper);
        
        wrapper.appendChild(stepper);
        this.container.appendChild(wrapper);
        this.updateStyles();
    }
    
    getValue() {
        return this.value;
    }
    
    setValue(value) {
        this.value = Math.max(Math.min(value, this.max), this.min);
        this.updateStyles();
    }
}

