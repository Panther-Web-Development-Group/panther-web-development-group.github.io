const mobileObserver = window.matchMedia( "(width <= 768px)" );
const tabletObserver = window.matchMedia( "(width > 768px) and (width <= 1024px)" );
const navigationTrigger = document.querySelector( "button#navigation__trigger-button" );
const navigationClose = document.querySelector( "button#navigation__close-button" );
const navigationContainer = document.querySelector( "#navigation__inner" );

navigationTrigger.addEventListener( "click", ( ) => { 
	navigationContainer.classList.toggle( "show" );
} );

navigationClose.addEventListener( "click", ( ) => {
	navigationContainer.classList.remove( "show" );
} );

const checkMobileViewport = ( ) => {
	document.body.classList.toggle( "mobile", mobileObserver.matches );
	
	if ( !mobileObserver.matches ) navigationContainer.classList.remove( "show" );

	mobileObserver.addEventListener( "change", e => { 
		document.body.classList.toggle( "mobile", e.matches );
		if ( !e.matches ) navigationContainer.classList.remove( "show" );
	} );	
}

const checkTabletViewport = ( ) => { 
	document.body.classList.toggle( "tablet", tabletObserver.matches );
	tabletObserver.addEventListener( "change", e => { 
		document.body.classList.toggle( "tablet", e.matches );
	} );
};

const checkViewports = ( ) => { 
	checkMobileViewport( );
	checkTabletViewport( );
};

checkViewports( );