VER = 1.0.0
TRDEV = granatumx/webapp-dev:$(VER)
main:
	yarn install
	yarn build
docker:
	docker build -f Dockerfile.dev -t $(TRDEV) .
docker-push:
	docker push $(TRDEV)
shell:
	docker run --rm -it $(TRDEV) bash
doc:
	doconce format pandoc README --github_md
