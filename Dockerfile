FROM pablozaiden/typescript:onbuild

# Create this as a development environment. 
# Comment this out for production.
ENV NODE_ENV=development

# Expose the default http port for the node web app
EXPOSE 3000/tcp