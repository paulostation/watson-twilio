const request = require("request"),
	app = require("../app"),
	chai = require("chai"),
	{ expect } = require("chai"),
	should = require("chai").should(),
	chaiHttp = require("chai-http");


describe('workspaces', function () {
	it('should list ALL workspaces on /workspaces GET', done => {

		chai.request(app)
			.get("/api/workspaces")
			.end(function (err, res) {
				console.log(res.body);
				expect(err).to.be.null;
				expect(res).to.have.status(200);
				expect(res.body).to.be.an("object");
				expect(Object.keys(res.body).length).to.be.above(0);
				done();
			});
	});
	// it('should list a SINGLE workspace on /workspace/<id> GET');
	// it('should add a SINGLE workspace on /workspaces POST');
	it('should add a SINGLE workspace on /workspace/<id> PUT', done => {

		chai.request(app)
			.put("/api/workspaces")
			.send({ workspaceId: "aaaaaa", workspaceName: "test" })
			.end(function (err, res) {

				expect(err).to.be.null;
				expect(res).to.have.status(200);
				expect(res.body).to.be.an("object");
				done();

			});
	});
	it('should update a SINGLE workspace on /workspace/<id> PATCH', done => {

		chai.request(app)
			.patch("/api/workspaces")
			.send({ workspaceName: "test", workspaceId: "test sucessful" })
			.end(function (err, res) {

				expect(err).to.be.null;
				expect(res).to.have.status(200);
				expect(res.body).to.be.an("object");
				done();

			});
	});
	it('should delete a SINGLE workspace on /workspace/<id> DELETE', done => {

		chai.request(app)
			.delete("/api/workspaces")
			.send({ workspaceName: "test" })
			.end(function (err, res) {

				expect(err).to.be.null;
				expect(res).to.have.status(200);
				expect(res.body).to.be.an("object");
				done();

			});
	});
});

chai.use(chaiHttp);