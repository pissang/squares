(function (global) {

    global.Dice = function (dom, max) {
        max = max || 6;

        var $out = document.createElement('div');
        $out.style.cssText = 'color: #fff; font-size:50px;';
        dom.appendChild($out);
        var $rollBtn = document.createElement('button');
        $rollBtn.innerHTML = 'roll';
        $rollBtn.style.cssText = 'font-size:30px;';
        dom.appendChild($rollBtn);

        var self = this;
        
        this.roll = function () {
            if (self._rolling || this._disabled) {
                return;
            }

            self._rolling = true;

            var gap = 1;
            function random() {
                var num = Math.round((max - 1) * Math.random()) + 1;
                $out.innerHTML = num;

                if (gap >= 200) {
                    self.onroll && self.onroll(num);
                    self._rolling = false;
                    return;
                }

                gap *= 1.2;

                setTimeout(random, gap);
            }

            setTimeout(random, gap);
        }

        this.disable = function () {
            this._disabled = true;
        }
        this.enable = function () {
            this._disabled = false;
        }

        $rollBtn.addEventListener('click', this.roll);
    }
})(window);