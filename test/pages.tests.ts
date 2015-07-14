module spa.tests {
    describe('Home page', () => {
        var page: main.pages.HomePage; // object to test

        beforeEach(() => {
            page = new main.pages.HomePage();
        });

        it('should has special title', () => {
            expect(page.name).toEqual('home-page');
        });

    });
}