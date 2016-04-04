
export default function DateService(app) {
    app.factory('dateService', () => ({
        // FIXME: Query the server for the current date
        date: new Date(),
    }));
};
