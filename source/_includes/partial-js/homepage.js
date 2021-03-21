new Splide('#homepage-slider', {
	type   : 'loop',
	padding: {
		right: '160px',
		left : '160px',
	},
	updateOnMove: true,
	speed: 800,
	breakpoints: {
		1140: {
			padding: {
				right: '100px',
				left : '100px',
			}
		},
		768: {
			padding: {
				right: '40px',
				left : '40px',
			}
		}
	}
}).mount();
